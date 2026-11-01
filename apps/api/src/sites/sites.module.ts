import { Module } from '@nestjs/common';

import { SitesAdminController } from './sites-admin.controller';
import { SitesAdminService } from './sites-admin.service';

@Module({
  controllers: [SitesAdminController],
  providers: [SitesAdminService],
  exports: [SitesAdminService],
})
export class SitesModule {}
