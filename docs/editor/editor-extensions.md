# Custom Editor Extensions & ProseMirror Schemas

## Overview

The editorial system introduces custom Tiptap block nodes tailored for multi-site publishing requirements:

1. **`DestinationInfoBlock`**: Specialized structured data card for travel destinations.
2. **`EventTimelineBlock`**: Specialized live event update card for air sports and competitions.
3. **`CalloutBlock`**: Universal contextual alert box for warnings, tips, and highlights.

## Extension Implementation Details

### 1. Destination Info Block (`destination-info-block.ts`)

Encapsulates rich destination metadata directly inside the ProseMirror document AST:

- **Attributes**:
  - `destination`: Name of the landmark or destination.
  - `country`: Country or region.
  - `elevation`: Elevation in meters or feet.
  - `bestSeason`: Optimal travel seasons (e.g., "Spring & Autumn").
  - `difficulty`: Travel or trekking difficulty (`easy`, `moderate`, `challenging`, `expert`).
  - `tags`: Comma-separated descriptors.
- **ProseMirror Node Configuration**:
  - `group`: `'block'`
  - `atom`: `true` (treated as a single atomic unit in the document)
  - `parseHTML`: Matches `div[data-type="destination-info-card"]`
  - `renderHTML`: Renders a structured card with CSS styling and attributes serialized as HTML dataset attributes.

### 2. Event Timeline Block (`event-timeline-block.ts`)

Captures point-in-time updates for breaking news, race progress, or meteorological reports:

- **Attributes**:
  - `timestamp`: Event timestamp or time offset.
  - `title`: Short headline of the event milestone.
  - `description`: Narrative summary.
  - `windConditions`: Wind speed and direction (e.g., "14 kts NW").
  - `weather`: Sky conditions, visibility, and temperature.
  - `alertLevel`: Operational urgency (`info`, `caution`, `critical`).
- **ProseMirror Node Configuration**:
  - `group`: `'block'`
  - `atom`: `true`
  - `parseHTML`: Matches `div[data-type="event-timeline-card"]`
  - `renderHTML`: Renders with alert-specific color accents (blue for info, amber for caution, rose for critical).

### 3. Callout Block (`callout-block.ts`)

Editorial callout container for editor notes, sidebars, or advisories:

- **Attributes**:
  - `variant`: `info` | `tip` | `warning` | `danger`
- **ProseMirror Node Configuration**:
  - `group`: `'block'`
  - `content`: `'block+'` (can contain nested paragraphs and lists)
  - `defining`: `true`

## Custom Block Insertion Workflow

Custom blocks are registered as standard Tiptap commands (`setDestinationInfo`, `setEventTimeline`, `setCallout`). Editors trigger block insertion via the toolbar's "Custom Blocks" dropdown, which opens `CustomBlockModal` to collect strongly typed attributes before dispatching the command into the ProseMirror transaction pipeline.
