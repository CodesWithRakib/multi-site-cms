# Failure Recovery, Resilience & Degradation Modes

## 1. Resilience Philosophy

Spectators attending or watching air sports events frequently experience transient network loss (cellular edge dropouts in mountainous alpine zones, airport RF congestion). The application is engineered to degrade gracefully without throwing fatal errors.

---

## 2. Failure Scenarios & Mitigations

### 2.1 Backend API Offline or Partitioned

- **Symptoms**: `fetch` calls to `http://localhost:4000` return `ECONNREFUSED` or timeout.
- **Handling**:
  - `src/lib/api.ts` traps network rejections in `try...catch` blocks.
  - Server Components render responsive empty states with informative status chips.
  - Next.js build (`next build`) static page generation passes cleanly without failing pipelines.
  - When the backend resumes, dynamic runtime ISR automatically refreshes pages.

### 2.2 SSE Stream Interruption

- **Symptoms**: `EventSource` connection drops or proxy terminates text/event-stream.
- **Handling**:
  - `useRealtimeStream` activates exponential backoff with jitter:
    - Attempt 1: ~2 seconds
    - Attempt 2: ~4 seconds
    - Attempt 3: ~8 seconds
    - Attempt 4: ~16 seconds
    - Attempt 5: ~30 seconds max
  - Displays non-alarmist status chip: `RECONNECTING...`.

### 2.3 Permanent Stream Disconnection (Fallback Mode)

- **Symptoms**: 5 consecutive connection failures occur (e.g. client is behind an aggressive corporate firewall blocking streaming HTTP).
- **Handling**:
  - Switches to `fallback` mode.
  - Initiates gentle background polling every 60 seconds (`setInterval(executeFallbackPoll, 60000)`).
  - Displays `FALLBACK (POLLING 60S)` status pill with a manual "Refresh" button.
  - Listens to `visibilitychange`: when the spectator switches back to the tab, an immediate fetch is executed.

### 2.4 Missed Updates Recovery

- **Symptoms**: Spectator was offline for 10 minutes while multiple race heats concluded.
- **Handling**:
  - Upon reconnection, supplies `lastEventId` to stream query (`?lastEventId=...`).
  - Server replays buffered missed events (up to 50 items).
  - If buffer was exceeded, triggers REST query to `/posts?limit=10` to sync state with PostgreSQL.
