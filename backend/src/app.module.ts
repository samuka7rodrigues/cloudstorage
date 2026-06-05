import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './lib/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { FoldersModule } from './modules/folders/folders.module';
import { ShareModule } from './modules/share/share.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
    ]),
    AuthModule,
    UsersModule,
    StorageModule,
    FoldersModule,
    ShareModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
