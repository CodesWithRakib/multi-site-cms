# Real-Time Client & Server-Sent Events (SSE)

## 1. Transport Rationale

Air Sports implements Server-Sent Events (SSE) rather than WebSockets:

- **Unidirectional Match**: Live news dispatches flow from the central editorial desk to spectators; client-to-server bidirectional channels are not needed.
- **Firewall & Proxy Compatibility**: Runs over standard HTTP/1.1 and HTTP/2. Traversing enterprise proxies, reverse proxies, and CDN edge networks without WebSocket upgrade failures.
- **Native Browser Resiliency**: Native `EventSource` supports connection maintenance and ping heartbeats out of the box.

---

## 2. Real-Time Hook Architecture (`useRealtimeStream.ts`)

```
               ┌──────────────────────────────────────────────┐
               │         Browser EventSource Listener         │
               │   GET /api/v1/realtime/air-sports/stream     │
               └──────────────────────┬───────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   system.connected                 ping            air_sports.update.published
  (Record connection)       (Update last ping)       (Receive event notification)
                                                                │
                                                                ▼
                                                    ┌────────────────────────┐
                                                    │  Authoritative Fetch   │
                                                    │  GET /posts/:slug      │
                                                    └───────────┬────────────┘
                                                                │
                                                                ▼
                                                    ┌────────────────────────┐
                                                    │ Deduplicate & Prepend  │
                                                    │   into LiveTimeline    │
                                                    └────────────────────────┘
```

### Connection State Machine

The client exposes four distinct states:

1. `connecting`: Initial handshake in progress.
2. `connected`: Stream active; ping heartbeat received within the last 60 seconds.
3. `reconnecting`: Network interrupted; performing exponential backoff with jitter (2s, 4s, 8s, 16s, up to 30s).
4. `fallback`: 5 consecutive reconnection failures; switched to bounded 60-second polling and window focus revalidation.

---

## 3. Disconnection & Missed Updates Recovery

When a spectator reconnects after mobile network loss:

1. The client supplies `lastEventId` in the SSE stream query (`?lastEventId=...`).
2. The server replays any buffered missed events (up to 50 items stored in `RealtimeService`).
3. If the event buffer has advanced past the reconnecting client's ID, the client invokes `GET /api/v1/realtime/air-sports/missed-updates?lastEventId=...` or executes an authoritative REST fetch to ensure no race results were missed.

---

## 4. Accessibility & Screen Reader Consideration

Live streams must not overwhelm screen-reader users with repetitive announcements.

- The hook manages a dedicated polite live region:
  ```tsx
  <div className="sr-only" role="status" aria-live="polite">
    {liveAnnouncement}
  </div>
  ```
- Only high-priority dispatches (e.g. `New publication: ${title}`) are announced.
- Heartbeat pings and reconnect events do not emit voice announcements.
