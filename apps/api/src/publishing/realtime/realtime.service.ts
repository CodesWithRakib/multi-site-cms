import { Injectable, Logger, type MessageEvent } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { AirSportsUpdatePayload, PublicationPublishedPayload } from '../publishing.types';

export interface RealtimeBroadcastMessage {
  id: string; // Event UUID
  type: string; // e.g. 'air_sports.update.published' or 'publication.published'
  siteKey: string;
  publicationId: string;
  postId: string;
  slug: string;
  title: string;
  publishedAt: string;
  alertLevel?: string;
  windConditions?: string;
  weather?: string;
  timestamp: number;
}

/**
 * Real-time event broker for live updates (e.g. Air Sports breaking events).
 * Operates over standard HTTP Server-Sent Events (SSE) compatible with all reverse proxies,
 * load balancers, and free-tier hosting platforms without requiring custom WebSocket upgrades.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly eventBus$ = new Subject<RealtimeBroadcastMessage>();

  // Buffer of recent events per siteKey for reconnecting clients (last 50 events)
  private readonly eventHistory = new Map<string, RealtimeBroadcastMessage[]>();
  private readonly maxHistoryPerSite = 50;

  /**
   * Broadcasts a live update to all active subscribers for the given site channel.
   * This method is invoked by the Outbox Dispatcher only AFTER the database transaction has committed.
   */
  broadcast(
    siteKey: string,
    payload: AirSportsUpdatePayload | PublicationPublishedPayload,
    eventId: string,
    eventType: string = 'air_sports.update.published',
  ): void {
    const airSportsPayload = payload as AirSportsUpdatePayload;
    const message: RealtimeBroadcastMessage = {
      id: eventId,
      type: eventType,
      siteKey,
      publicationId: payload.publicationId,
      postId: payload.postId,
      slug: payload.slug,
      title: payload.title,
      publishedAt: payload.publishedAt,
      alertLevel: airSportsPayload.alertLevel,
      windConditions: airSportsPayload.windConditions,
      weather: airSportsPayload.weather,
      timestamp: Date.now(),
    };

    // Store in history buffer
    const history = this.eventHistory.get(siteKey) || [];
    history.push(message);
    if (history.length > this.maxHistoryPerSite) {
      history.shift();
    }
    this.eventHistory.set(siteKey, history);

    this.logger.log(
      `Broadcasting real-time event [${eventType}] for site [${siteKey}]: "${message.title}" (${message.id})`,
    );

    this.eventBus$.next(message);
  }

  /**
   * Returns an Observable stream of MessageEvents for a specific siteKey.
   */
  getEventStream(siteKey: string): Observable<MessageEvent> {
    return this.eventBus$.asObservable().pipe(
      filter((msg) => msg.siteKey === siteKey),
      map((msg) => ({
        id: msg.id,
        type: msg.type,
        data: JSON.stringify(msg),
      })),
    );
  }

  /**
   * Retrieves missed historical events since `lastEventId` for a reconnecting client.
   */
  getMissedEvents(siteKey: string, lastEventId: string): RealtimeBroadcastMessage[] {
    const history = this.eventHistory.get(siteKey) || [];
    const index = history.findIndex((e) => e.id === lastEventId);
    if (index === -1) {
      return []; // Event not in recent window, client should fetch latest from REST API
    }
    return history.slice(index + 1);
  }

  /**
   * Exposes count of cached events for operational health monitoring.
   */
  getStats(): { bufferedSites: number; totalBufferedEvents: number } {
    let total = 0;
    for (const events of this.eventHistory.values()) {
      total += events.length;
    }
    return {
      bufferedSites: this.eventHistory.size,
      totalBufferedEvents: total,
    };
  }
}
