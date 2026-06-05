import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { ListContentDto } from './dto/list-content.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, MaxLength, IsISO8601 } from 'class-validator';

class RenameFolderDto {
  @IsString()
  @MaxLength(255)
  name: string;
}

class ShareFolderDto {
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private folders: FoldersService) {}

  @Post()
  async create(@Body() dto: CreateFolderDto, @CurrentUser('id') userId: string) {
    return this.folders.create(userId, dto);
  }

  @Get('tree')
  async tree(@CurrentUser('id') userId: string) {
    return this.folders.getFolderTree(userId);
  }

  @Get('content')
  async listRootContent(
    @Query() query: ListContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.folders.listContent(userId, null, query.limit, query.offset);
  }

  @Get(':id/content')
  async listFolderContent(
    @Param('id') folderId: string,
    @Query() query: ListContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.folders.listContent(userId, folderId, query.limit, query.offset);
  }

  @Get(':id/breadcrumbs')
  async breadcrumbs(@Param('id') folderId: string, @CurrentUser('id') userId: string) {
    return this.folders.getBreadcrumbs(userId, folderId);
  }

  @Patch(':id')
  async rename(
    @Param('id') folderId: string,
    @Body() dto: RenameFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.folders.rename(userId, folderId, dto.name);
  }

  @Post(':id/share')
  async toggleShare(
    @Param('id') folderId: string,
    @Body() dto: ShareFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.folders.toggleShare(userId, folderId, dto.expiresAt);
  }

  @Delete(':id')
  async delete(@Param('id') folderId: string, @CurrentUser('id') userId: string) {
    return this.folders.delete(userId, folderId);
  }
}
