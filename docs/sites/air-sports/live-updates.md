# Live Updates, Breaking News & Event Timelines

## 1. Breaking News Architecture

A dedicated breaking news system prioritizes urgent aeronautical dispatches (safety notices, weather groundings, record breaks, and heat winners):

- **Data Origin**: Identified by `templateKey = 'breaking'` or `type = 'news'`.
- **Presentation**: Rendered at the top of the homepage as a high-visibility `BreakingNewsBanner` with an animated flame icon and direct link to the story.
- **Lifecycle Guarantees**:
  - When an item is unpublished or its `templateKey` is cleared in the CMS, it immediately disappears from the banner on next revalidation or webhook trigger.
  - Returns `404 Not Found` if a reader attempts to visit an unpublished breaking news slug.

---

## 2. Chronological Live Timeline (`LiveTimeline.tsx`)

The Live Timeline provides a real-time chronological stream of competition updates:

### Timestamp Distinction

The system strictly distinguishes three independent points in time:

1. **Event Occurrence Time**: When the race action or weather reading actually happened (encoded in `eventTimelineBlock.time` or article body).
2. **Authoritative Publication Time**: When the editorial controller verified and committed the update to the database (`publishedAt`). This is the authoritative sort key.
3. **Client Receipt Time**: When the spectator's browser received the SSE event or poll response. This is never used for ordering.

### Stable Ordering Invariant

Timeline items are ordered strictly by:

```typescript
Array.from(map.values()).sort((a, b) => {
  const timeA = new Date(a.publishedAt).getTime();
  const timeB = new Date(b.publishedAt).getTime();
  if (timeB !== timeA) return timeB - timeA;
  return b.slug.localeCompare(a.slug); // Stable secondary key
});
```

### Memory Bounding

To avoid browser memory leaks during day-long competitions:

- The internal state is capped at **50 items** (`maxTimelineItems = 50`).
- The initial render shows 10 items. Readers can click "Load Older Updates" to reveal more in 10-item increments.

---

## 3. Event Timelines & Custom Tiptap Extensions

Inside article bodies, complex competition logs are rendered using custom Tiptap ProseMirror extensions:

### `eventTimelineBlock`

Structured block storing:

- `time`: e.g. `14:30`
- `title`: e.g. `Round 2 Heat Launch`
- `status`: `'scheduled' | 'live' | 'completed' | 'delayed' | 'cancelled'`
- `windSpeed`: e.g. `24 kts WNW`
- `weatherCondition`: e.g. `Scattered Cirrus`
- `alertLevel`: `'normal' | 'advisory' | 'warning'`

Rendered cleanly by `DocRenderer` with status badges, wind speed icons, and warning tints.
