import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
