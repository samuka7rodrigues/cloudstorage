import { Module } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [StorageController],
  providers: [StorageService, PrismaService],
  exports: [StorageService],
})
export class StorageModule {}
