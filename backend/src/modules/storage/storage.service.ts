import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  PayloadTooLargeException,
  NotFoundException,
} from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { PrismaService } from '../../lib/prisma.service';
import {
  BLOCKED_EXTENSIONS,
  MAX_FILE_SIZE,
} from '../../common/constants/blocked-extensions';

@Injectable()
export class StorageService {
  private s3: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });
  }

  async requestUpload(
    userId: string,
    fileName: string,
    mimeType: string,
    folderId?: string,
  ) {
    const ext = path.extname(fileName).toLowerCase();

    if (BLOCKED_EXTENSIONS.has(ext)) {
      throw new ForbiddenException(`File extension "${ext}" is not allowed`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true, storageUsed: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bucket = process.env.S3_BUCKET || 'cloud-storage';
    const storageKey = `${userId}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 900,
    });

    return { presignedUrl, storageKey };
  }

  async confirmUpload(
    userId: string,
    storageKey: string,
    name: string,
    size: number,
    mimeType: string,
    folderId?: string,
  ) {
    if (size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true, storageUsed: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStorageUsed = Number(user.storageUsed) + size;
    if (newStorageUsed > Number(user.storageLimit)) {
      throw new ForbiddenException('Storage limit exceeded');
    }

    if (folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder || folder.userId !== userId) {
        throw new NotFoundException('Folder not found');
      }
    }

    const finalName = await this.resolveDuplicateName(
      userId,
      name,
      folderId ?? null,
    );

    const file = await this.prisma.file.create({
      data: {
        name: finalName,
        size: BigInt(size),
        mimeType,
        storageKey,
        folderId: folderId ?? null,
        userId,
      },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: size } },
    });

    return file;
  }

  async getPresignedDownloadUrl(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== userId) {
      throw new NotFoundException('File not found');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET || 'cloud-storage',
      Key: file.storageKey,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    return { url, name: file.name, mimeType: file.mimeType, size: file.size };
  }

  async getPublicDownloadUrl(shareToken: string) {
    const file = await this.prisma.file.findUnique({
      where: { shareToken },
    });

    if (!file || !file.isPublic) {
      throw new NotFoundException('File not found or not public');
    }

    if (file.expiresAt && new Date() > file.expiresAt) {
      throw new ForbiddenException('Share link has expired');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET || 'cloud-storage',
      Key: file.storageKey,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    return { url, name: file.name, mimeType: file.mimeType, size: file.size };
  }

  async moveFile(
    userId: string,
    fileId: string,
    targetFolderId: string | null,
  ) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== userId) {
      throw new NotFoundException('File not found');
    }

    if (file.folderId === targetFolderId) {
      return file;
    }

    if (targetFolderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: targetFolderId },
      });

      if (!folder || folder.userId !== userId) {
        throw new NotFoundException('Target folder not found');
      }
    }

    const finalName = await this.resolveDuplicateName(
      userId,
      file.name,
      targetFolderId,
    );

    return this.prisma.file.update({
      where: { id: fileId },
      data: {
        folderId: targetFolderId,
        name: finalName,
      },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== userId) {
      throw new NotFoundException('File not found');
    }

    const size = Number(file.size);

    await this.prisma.file.delete({
      where: { id: fileId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: size } },
    });

    return { deleted: true };
  }

  private async resolveDuplicateName(
    userId: string,
    name: string,
    folderId: string | null,
  ): Promise<string> {
    const existing = await this.prisma.file.findFirst({
      where: { userId, folderId: folderId ?? null, name },
    });

    if (!existing) return name;

    const ext = path.extname(name);
    const base = path.basename(name, ext);
    let counter = 2;

    while (true) {
      const newName = `${base} (${counter})${ext}`;
      const conflict = await this.prisma.file.findFirst({
        where: { userId, folderId: folderId ?? null, name: newName },
      });
      if (!conflict) return newName;
      counter++;
    }
  }
}
