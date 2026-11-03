import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { CommentsAdminController } from './comments-admin.controller';
import { CommentsAdminService } from './comments-admin.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [CommentsAdminController],
  providers: [CommentsAdminService],
  exports: [CommentsAdminService],
})
export class CommentsModule {}

