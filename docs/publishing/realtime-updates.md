# Real-Time Updates & Server-Sent Events (SSE)

## Overview & Technical Rationale

The Air Sports website (`apps/sites/air-sports`) features fast-breaking event updates, race leaderboards, and weather advisories. To deliver low-latency updates to thousands of concurrent spectators without polling, the platform implements **Server-Sent Events (SSE)**.

### Why SSE Over WebSockets?

1. **Unidirectional Efficiency**: Publishing updates flow strictly from server to client; client-to-server bi-directional communication is not needed for reading news.
2. **Standard HTTP/2 Multiplexing**: SSE operates over plain HTTP/1.1 or HTTP/2, traversing enterprise firewalls, CDNs, and proxies without WebSocket upgrade failures.
3. **Native Browser Support**: The standard browser `EventSource` API handles connection management, heartbeats, and basic reconnection automatically.
4. **Zero Heavy Infrastructure**: Runs natively in NestJS using RxJS subjects without external message brokers or socket daemons.

---

## Architecture & Site Scoping

Real-time streams are strictly partitioned by site key:

```
GET /api/v1/realtime/:siteKey/stream
```

```
+--------------------+        Publishes update        +-----------------------+
|  Air Sports Admin  | -----------------------------> |   PublishingService   |
+--------------------+                                +-----------------------+
                                                                  |
                                                                  v
                                                      +-----------------------+
                                                      |     outbox_events     |
                                                      +-----------------------+
                                                                  |
                                                                  | worker dispatch
                                                                  v
                                                      +-----------------------+
                                                      |    RealtimeService    |
                                                      +-----------------------+
                                                                  |
                                               +------------------+------------------+
                                               | (channel: air-sports)               | (channel: travel-blog)
                                               v                                     v
                                    +--------------------+                +--------------------+
                                    | Air Sports Clients |                | Travel Blog Clients|
                                    +--------------------+                +--------------------+
```

### Strict Channel Isolation

- Clients connected to `/api/v1/realtime/air-sports/stream` receive only events targeted to the `air-sports` site key.
- Events for other sites (e.g., `travel-blog`) are strictly filtered out at the server stream level.

---

## Draft & Unapproved Content Suppression

The real-time broadcaster enforces strict privacy invariants:

- **No Drafts**: Only publications that have reached `status = 'published'` are emitted to public streams.
- **Outbox Guard**: The `OutboxDispatcherWorker` checks the event type (`publication.published` or `airsports.update.published`) before pushing to the `RealtimeService` bus.
- Unapproved revisions, drafts, or internal notes can never leak into the real-time stream.

---

## Client Reconnection & Missed Updates

When mobile clients experience transient cellular disconnections, they must be able to backfill missed updates upon reconnecting.

### 1. In-Memory Ring Buffer

The `RealtimeService` maintains a bounded circular buffer storing the **50 most recent events** per site channel:

```typescript
private readonly eventHistory = new Map<string, RealtimeBroadcastEvent[]>();
private readonly maxHistoryPerSite = 50;
```

### 2. Missed Updates Endpoint

When a client reconnects, it supplies the last received event ID either via HTTP header `Last-Event-ID` or via the dedicated REST endpoint:

```http
GET /api/v1/realtime/air-sports/missed-updates?sinceId=evt-10492 HTTP/1.1
```

**Response**:

```json
{
  "data": [
    {
      "id": "evt-10493",
      "type": "airsports.update.published",
      "siteKey": "air-sports",
      "timestamp": "2026-11-01T14:45:10.000Z",
      "payload": {
        "slug": "championship-round-1-wind-advisory",
        "title": "Championship Round 1 Wind Advisory",
        "postType": "air_sports_update"
      }
    }
  ]
}
```

The client replays missed events sequentially and resumes listening to the live SSE stream seamlessly.
