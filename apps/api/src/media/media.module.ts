import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageProvider,
    },
  ],
  exports: [MediaService, STORAGE_PROVIDER],
})
export class MediaModule {}
