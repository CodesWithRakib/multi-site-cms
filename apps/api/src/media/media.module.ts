import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { env } from '../config/env';
import { DatabaseModule } from '../database/database.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryStorageProvider } from './storage/cloudinary-storage.provider';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    LocalStorageProvider,
    CloudinaryStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        localProvider: LocalStorageProvider,
        cloudinaryProvider: CloudinaryStorageProvider,
      ) => {
        return env.STORAGE_PROVIDER === 'cloudinary' ? cloudinaryProvider : localProvider;
      },
      inject: [LocalStorageProvider, CloudinaryStorageProvider],
    },
  ],
  exports: [MediaService, STORAGE_PROVIDER],
})
export class MediaModule {}
