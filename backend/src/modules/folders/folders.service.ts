import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../lib/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFolderDto) {
    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.userId !== userId) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    const existing = await this.prisma.folder.findFirst({
      where: {
        userId,
        parentId: dto.parentId ?? null,
        name: dto.name,
      },
    });

    if (existing) {
      throw new BadRequestException('A folder with this name already exists here');
    }

    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        userId,
      },
    });
  }

  async listContent(userId: string, folderId: string | null, limit = 50, offset = 0) {
    if (folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder || folder.userId !== userId) {
        throw new NotFoundException('Folder not found');
      }
    }

    const [folders, files, totalFolders, totalFiles] = await Promise.all([
      this.prisma.folder.findMany({
        where: { userId, parentId: folderId ?? null },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.file.findMany({
        where: { userId, folderId: folderId ?? null },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.folder.count({
        where: { userId, parentId: folderId ?? null },
      }),
      this.prisma.file.count({
        where: { userId, folderId: folderId ?? null },
      }),
    ]);

    return {
      folders,
      files,
      total: totalFolders + totalFiles,
      limit,
      offset,
    };
  }

  async getBreadcrumbs(userId: string, folderId: string | null) {
    if (!folderId) return [];

    const breadcrumbs: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true, userId: true },
      });

      if (!folder || folder.userId !== userId) break;

      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  async delete(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== userId) {
      throw new NotFoundException('Folder not found');
    }

    await this.prisma.folder.delete({ where: { id: folderId } });

    return { deleted: true };
  }

  async rename(userId: string, folderId: string, name: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== userId) {
      throw new NotFoundException('Folder not found');
    }

    const existing = await this.prisma.folder.findFirst({
      where: {
        userId,
        parentId: folder.parentId,
        name,
        id: { not: folderId },
      },
    });

    if (existing) {
      throw new BadRequestException('A folder with this name already exists here');
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { name },
    });
  }

  async toggleShare(userId: string, folderId: string, expiresAt?: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== userId) {
      throw new NotFoundException('Folder not found');
    }

    const now = folder.isPublic
      ? { isPublic: false, expiresAt: null as any }
      : {
          isPublic: true,
          shareToken: folder.shareToken || uuidv4(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        };

    const updated = await this.prisma.folder.update({
      where: { id: folderId },
      data: now,
    });

    return {
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      expiresAt: updated.expiresAt,
    };
  }

  async getPublicFolder(token: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { shareToken: token },
    });

    if (!folder || !folder.isPublic) {
      throw new NotFoundException('Folder not found or not shared');
    }

    if (folder.expiresAt && new Date() > folder.expiresAt) {
      throw new NotFoundException('Share link has expired');
    }

    return folder;
  }

  async getPublicFolderContent(token: string, folderId?: string) {
    const sharedFolder = await this.prisma.folder.findUnique({
      where: { shareToken: token },
    });

    if (!sharedFolder || !sharedFolder.isPublic) {
      throw new NotFoundException('Folder not found or not shared');
    }

    if (sharedFolder.expiresAt && new Date() > sharedFolder.expiresAt) {
      throw new NotFoundException('Share link has expired');
    }

    const targetFolderId = folderId || sharedFolder.id;

    const targetFolder = await this.prisma.folder.findUnique({
      where: { id: targetFolderId },
    });

    if (!targetFolder) {
      throw new NotFoundException('Folder not found');
    }

    const isDescendant = await this.isDescendantOf(
      targetFolder.id,
      sharedFolder.id,
    );

    if (targetFolder.id !== sharedFolder.id && !isDescendant) {
      throw new NotFoundException('Folder not accessible');
    }

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { parentId: targetFolderId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.file.findMany({
        where: { folderId: targetFolderId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      folder: targetFolder,
      folders,
      files,
    };
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

  async getFolderTree(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const tree = this.buildTree(folders, null);
    return tree;
  }

  private buildTree(
    folders: { id: string; name: string; parentId: string | null }[],
    parentId: string | null,
  ): any[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        id: f.id,
        name: f.name,
        childs: this.buildTree(folders, f.id),
      }));
  }
}
