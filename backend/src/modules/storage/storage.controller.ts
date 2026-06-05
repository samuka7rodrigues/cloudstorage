import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestUpload(
    @Body() dto: RequestUploadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storage.requestUpload(userId, dto.fileName, dto.mimeType, dto.folderId);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storage.confirmUpload(
      userId,
      dto.storageKey,
      dto.name,
      dto.size,
      dto.mimeType,
      dto.folderId,
    );
  }

  @Get('download/:id')
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') fileId: string, @CurrentUser('id') userId: string) {
    return this.storage.getPresignedDownloadUrl(userId, fileId);
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard)
  async move(
    @Param('id') fileId: string,
    @Body() dto: { folderId: string | null },
    @CurrentUser('id') userId: string,
  ) {
    return this.storage.moveFile(userId, fileId, dto.folderId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') fileId: string, @CurrentUser('id') userId: string) {
    return this.storage.deleteFile(userId, fileId);
  }
}
