# Content-Type-Aware Editor Configurations

## Overview

The editorial experience adapts dynamically based on the post's `type`:

- `article` / `editorial`: General long-form publishing.
- `travel_guide`: Destination guides with itinerary tables, destination cards, and rich galleries.
- `air_sports_update` / `live_event`: Fast-paced operational alerts, weather conditions, and live timelines.

## Configuration Presets (`editor-presets.ts`)

Instead of maintaining duplicate editor components, configuration presets determine which capabilities, toolbar buttons, and custom blocks are active for a given post type.

| Capability           | Generic Article         | Travel Guide                                  | Air Sports Update                              |
| :------------------- | :---------------------- | :-------------------------------------------- | :--------------------------------------------- |
| **Heading Levels**   | H1, H2, H3              | H1, H2, H3, H4                                | H2, H3                                         |
| **Tables Support**   | Optional                | Enabled (itineraries/pricing)                 | Disabled                                       |
| **YouTube Embeds**   | Enabled                 | Enabled                                       | Enabled                                        |
| **Image Uploads**    | Enabled                 | Enabled (galleries)                           | Enabled (live photos)                          |
| **Custom Blocks**    | Callouts                | Destination Cards, Callouts                   | Event Timeline Cards, Callouts                 |
| **Placeholder Text** | "Write your article..." | "Describe destination, itinerary, culture..." | "Publish breaking update or weather report..." |

## JSON Document Schema Enforcement

Regardless of the active preset, all documents serialize to valid ProseMirror JSON matching the backend JSONB validation constraints in NestJS (`BodyValidator`):

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Summit Conditions" }]
    },
    {
      "type": "eventTimelineBlock",
      "attrs": {
        "timestamp": "14:30 UTC",
        "title": "Launch Window Cleared",
        "description": "Wind has shifted from North to Northwest, stabilizing at 12 knots.",
        "windConditions": "12 kts NW",
        "weather": "Clear skies, visibility 25km",
        "alertLevel": "info"
      }
    }
  ]
}
```
