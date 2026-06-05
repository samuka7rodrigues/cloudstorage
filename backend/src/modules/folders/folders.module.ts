import { Module } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, PrismaService],
  exports: [FoldersService],
})
export class FoldersModule {}
