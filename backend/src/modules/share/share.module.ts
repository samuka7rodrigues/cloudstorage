import { Module } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  controllers: [ShareController],
  providers: [ShareService, PrismaService],
  exports: [ShareService],
})
export class ShareModule {}
