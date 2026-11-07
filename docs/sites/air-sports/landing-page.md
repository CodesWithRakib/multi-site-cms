# Air Sports landing page

Deliberately different from the Travel Blog's home: that one is a photo magazine
(full-bleed carousel, story grids, photo mosaic); this one is a **live control
tower** built around events and the newsroom wire. Both read only published CMS
data, so every section moves as content is added.

`app/page.tsx` loads up to 50 dispatches, the categories and the events once, and
`lib/home-feed.ts` (`buildHomeFeed`, unit tested) assigns them to slots without
repeating a dispatch.

| Section          | Content                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Flight deck hero | The newest dispatch with an image over its own cover, discipline links, live and upcoming events. |
| Telemetry strip  | Dispatches, live events, upcoming events and disciplines, all counted from the CMS.               |
| Flight schedule  | Departure-board list of live then soonest events (calendar tile, window, status). Hidden if none. |
| Top dispatches   | One big dispatch plus the timestamped wire beside it.                                             |
| Pick your sky    | Swipeable poster rail, one card per discipline with coverage, using its newest dispatch's cover.  |
| More dispatches  | Grid of further dispatches then "Browse all N dispatches". Layout follows the count (1, 2 or 3+). |
| Newsletter       | Signup banner.                                                                                    |

Rules that keep it honest and resilient:

- No figure is typed in; a stat that is zero shows zero (for example "Live now 0").
- A section with nothing to show hides itself, so a young site still looks complete.
- Text is never truncated where it carries meaning: event names wrap to two lines
  and stat labels wrap instead of being cut.
- The closing grid never leaves empty columns: one dispatch becomes a wide card, two
  fill two columns, three or more fill three.

## Dispatch card

`AirSportsCard` (standard) has a 16:9 cover and a two-line excerpt. Its footer is a
single line at any width: the author truncates, the "Read report" action never
wraps. On the article page, related coverage sits beside the table of contents, so
it uses two columns rather than three narrow ones.
