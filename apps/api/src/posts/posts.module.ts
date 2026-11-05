import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PublicCommentsService } from './public-comments.service';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule, SettingsModule],
  controllers: [PostsController, PublicationsController, PublicContentController],
  providers: [PostsService, PublicationsService, PublicContentService, PublicCommentsService],
  exports: [PostsService, PublicationsService, PublicContentService, PublicCommentsService],
})
export class PostsModule {}
