import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [PostsController, PublicationsController, PublicContentController],
  providers: [PostsService, PublicationsService, PublicContentService],
  exports: [PostsService, PublicationsService, PublicContentService],
})
export class PostsModule {}
