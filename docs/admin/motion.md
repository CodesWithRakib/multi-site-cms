# Motion in the admin and shared UI

Rules and decisions behind animation in `packages/ui` and `apps/admin`. The bar
is crisp and fast: this is a work tool used all day, so motion explains, it does
not decorate.

## Why `tw-animate-css` is a dependency

The shadcn components in `packages/ui` use `animate-in`, `fade-in-0`,
`zoom-in-95`, `slide-in-from-*`. Those utilities are **not part of Tailwind**;
they come from `tw-animate-css`. Without it the classes compile to nothing, and
every dropdown, select, popover, dialog and sheet appeared instantly (measured:
`animation-name: none` right after opening). It is imported once, in
`packages/ui/src/styles.css`. It is the library the shadcn Tailwind v4 setup
specifies, is CSS only (no runtime JS), and is MIT licensed.

## Rules

| Rule                                                                                                                         | Why                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Overlays that hang off a trigger (dropdown, select, popover, tooltip) set `origin-(--radix-<name>-content-transform-origin)` | They grow from the trigger, not from their own centre. Modals stay centred                                                   |
| Entrances are `ease-out`, never `ease-in`                                                                                    | Starts fast, feels responsive                                                                                                |
| UI motion stays under 300 ms                                                                                                 | Drawer: 300 ms open, 200 ms close, `cubic-bezier(0.32,0.72,0,1)`                                                             |
| Buttons get `motion-safe:active:scale-[0.97]` over 150 ms                                                                    | Press feedback                                                                                                               |
| Never `transition-all`                                                                                                       | It animates every property, off the GPU. Name the properties, or use plain `transition` (colour, shadow, opacity, transform) |
| Animate `transform` and `opacity`, not layout                                                                                | Width/position animations are the exception and are listed below                                                             |
| Reduced motion keeps fades, drops movement                                                                                   | See below                                                                                                                    |

## Reduced motion

`packages/ui/src/styles.css` neutralises the enter/exit translate, scale and
rotate variables under `prefers-reduced-motion: reduce`, so overlays still fade
but no longer slide or scale. `animate-ping` and `animate-bounce` stop.
Spinners keep spinning: they are the only sign that work is in progress.

## Deliberate `transition-all`

These animate width or position on purpose and keep `transition-all`:
progress bars in `tutorials/page.tsx` and the analytics cards
(`CountryDemographicsCard`, `DeviceAndBrowserCard`, `RealtimeTrafficWidget`,
`TopPagesTable`, `TrafficSourcesCard`), the editor `WordCountBar`, the
`PostPreviewModal` device width, and the `AnalyticsTimeChart` tooltip.

## What cannot be checked from code

Feel (a spring, a crossfade) must be judged in a browser: slow the animation in
DevTools, step frame by frame, and test gestures on a real device.
