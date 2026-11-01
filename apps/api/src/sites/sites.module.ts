import { Module } from '@nestjs/common';

import { DomainResolutionService } from './domain-resolution.service';
import { SitesAdminController } from './sites-admin.controller';
import { SitesAdminService } from './sites-admin.service';
import { SitesPublicController } from './sites-public.controller';
import { SitesPublicService } from './sites-public.service';

@Module({
  controllers: [SitesAdminController, SitesPublicController],
  providers: [SitesAdminService, SitesPublicService, DomainResolutionService],
  exports: [SitesAdminService, SitesPublicService, DomainResolutionService],
})
export class SitesModule {}
