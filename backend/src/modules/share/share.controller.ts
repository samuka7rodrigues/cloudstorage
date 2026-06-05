import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsISO8601 } from 'class-validator';

class ToggleShareDto {
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

@Controller('share')
export class ShareController {
  constructor(private share: ShareService) {}

  @Post(':fileId')
  @UseGuards(JwtAuthGuard)
  async toggleShare(
    @Param('fileId') fileId: string,
    @Body() dto: ToggleShareDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.share.toggleShare(userId, fileId, dto.expiresAt);
  }

  @Get('public/:token')
  async getPublicFile(@Param('token') token: string) {
    return this.share.getPublicFile(token);
  }

  @Get('public/:token/download')
  async downloadPublicFile(@Param('token') token: string) {
    return this.share.getPublicDownloadUrl(token);
  }

  @Get('folder/:token')
  async getPublicFolder(@Param('token') token: string) {
    return this.share.getPublicFolder(token);
  }

  @Get('folder/:token/content')
  async getPublicFolderContent(@Param('token') token: string) {
    return this.share.getPublicFolderContent(token);
  }

  @Get('folder/:token/content/:subfolderId')
  async getPublicSubfolderContent(
    @Param('token') token: string,
    @Param('subfolderId') subfolderId: string,
  ) {
    return this.share.getPublicFolderContent(token, subfolderId);
  }

  @Get('folder/:token/download/:fileId')
  async downloadPublicFolderFile(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
  ) {
    return this.share.getPublicFolderFileDownload(token, fileId);
  }
}
