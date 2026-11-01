import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [PostsController, PublicationsController],
  providers: [PostsService, PublicationsService],
  exports: [PostsService, PublicationsService],
})
export class PostsModule {}
