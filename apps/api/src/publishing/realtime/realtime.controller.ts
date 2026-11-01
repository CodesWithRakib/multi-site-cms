import { Controller, Get, Headers, Param, Query, Sse, type MessageEvent } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { concat, from, interval, merge, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Public } from '../../auth/decorators/public.decorator';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get(':siteKey/missed-updates')
  @Public()
  @ApiOperation({
    summary: 'Retrieve missed updates since lastEventId for client reconnection',
  })
  @ApiResponse({ status: 200, description: 'Missed events array' })
  getMissedUpdates(@Param('siteKey') siteKey: string, @Query('lastEventId') lastEventId?: string) {
    if (!lastEventId) return { items: [] };
    const items = this.realtimeService.getMissedEvents(siteKey, lastEventId);
    return { items };
  }

  @Sse(':siteKey/stream')
  @Public()
  @ApiOperation({
    summary:
      'Server-Sent Events (SSE) live update stream for a specific website channel (e.g. air-sports)',
  })
  @ApiResponse({ status: 200, description: 'Text/event-stream connection established' })
  streamLiveUpdates(
    @Param('siteKey') siteKey: string,
    @Headers('last-event-id') headerLastId?: string,
    @Query('lastEventId') queryLastId?: string,
  ): Observable<MessageEvent> {
    const lastId = headerLastId || queryLastId;

    // 1. Initial connection greeting
    const initialEvents: MessageEvent[] = [
      {
        id: `connected-${Date.now()}`,
        type: 'system.connected',
        data: JSON.stringify({
          status: 'connected',
          siteKey,
          connectedAt: new Date().toISOString(),
        }),
      },
    ];

    // 2. If client reconnected with lastEventId, replay any missed buffered events
    if (lastId) {
      const missed = this.realtimeService.getMissedEvents(siteKey, lastId);
      for (const m of missed) {
        initialEvents.push({
          id: m.id,
          type: m.type,
          data: JSON.stringify(m),
        });
      }
    }

    const replay$ = from(initialEvents);

    // 3. Live events from the subject bus
    const live$ = this.realtimeService.getEventStream(siteKey);

    // 4. Periodic heartbeat ping (every 25 seconds) to prevent proxy / NAT timeouts
    const heartbeat$ = interval(25000).pipe(
      map((): MessageEvent => ({
        type: 'ping',
        data: JSON.stringify({ timestamp: Date.now() }),
      })),
    );

    return merge(concat(replay$, live$), heartbeat$);
  }
}
