import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../../lib/prisma.service';

@Injectable()
export class ShareService {
  private s3: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    });
  }

  async toggleShare(userId: string, fileId: string, expiresAt?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== userId) {
      throw new NotFoundException('File not found');
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        isPublic: !file.isPublic,
        shareToken: file.isPublic ? file.shareToken : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : file.isPublic ? null : undefined,
      },
    });

    return {
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      expiresAt: updated.expiresAt,
    };
  }

  async getPublicFile(token: string) {
    const file = await this.prisma.file.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        isPublic: true,
        expiresAt: true,
        storageKey: true,
        createdAt: true,
      },
    });

    if (!file || !file.isPublic) {
      throw new NotFoundException('File not found or not shared');
    }

    if (file.expiresAt && new Date() > file.expiresAt) {
      throw new ForbiddenException('Share link has expired');
    }

    return file;
  }

  async getPublicDownloadUrl(token: string) {
    const file = await this.prisma.file.findUnique({
      where: { shareToken: token },
    });

    if (!file || !file.isPublic) {
      throw new NotFoundException('File not found or not shared');
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

  async getPublicFolder(token: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { shareToken: token },
    });

    if (!folder || !folder.isPublic) {
      throw new NotFoundException('Folder not found or not shared');
    }

    if (folder.expiresAt && new Date() > folder.expiresAt) {
      throw new ForbiddenException('Share link has expired');
    }

    return folder;
  }

  async getPublicFolderContent(token: string, subfolderId?: string) {
    const sharedFolder = await this.prisma.folder.findUnique({
      where: { shareToken: token },
    });

    if (!sharedFolder || !sharedFolder.isPublic) {
      throw new NotFoundException('Folder not found or not shared');
    }

    if (sharedFolder.expiresAt && new Date() > sharedFolder.expiresAt) {
      throw new ForbiddenException('Share link has expired');
    }

    const targetId = subfolderId || sharedFolder.id;

    if (targetId !== sharedFolder.id) {
      const isDescendant = await this.isDescendantOf(targetId, sharedFolder.id);
      if (!isDescendant) {
        throw new NotFoundException('Folder not accessible');
      }
    }

    const [folder, folders, files] = await Promise.all([
      this.prisma.folder.findUnique({ where: { id: targetId } }),
      this.prisma.folder.findMany({
        where: { parentId: targetId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.file.findMany({
        where: { folderId: targetId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return { folder, folders, files };
  }

  async getPublicFolderFileDownload(token: string, fileId: string) {
    const sharedFolder = await this.prisma.folder.findUnique({
      where: { shareToken: token },
    });

    if (!sharedFolder || !sharedFolder.isPublic) {
      throw new NotFoundException('Folder not found or not shared');
    }

    if (sharedFolder.expiresAt && new Date() > sharedFolder.expiresAt) {
      throw new ForbiddenException('Share link has expired');
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const fileInSharedFolder = await this.isDescendantOf(
      file.folderId!,
      sharedFolder.id,
    );

    if (!fileInSharedFolder && file.folderId !== sharedFolder.id) {
      throw new NotFoundException('File not accessible');
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

  private async isDescendantOf(
    childId: string,
    parentId: string,
  ): Promise<boolean> {
    let currentId: string | null = childId;
    while (currentId) {
      if (currentId === parentId) return true;
      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (!folder) return false;
      currentId = folder.parentId;
    }
    return false;
  }
}
