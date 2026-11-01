# Multi-Site CMS Design System & Token Architecture

**Version:** 2.0.0  
**Scope:** `@multi-site-cms/ui`, `apps/admin`, `apps/sites/*`  
**Engine:** Tailwind CSS v4, CSS Variables, OKLCH Color Model

---

## 1. OKLCH Color System & Semantic Tokens

Our design tokens use the modern OKLCH color space for perceptual uniformity and accurate contrast across lightness levels. Hardcoded hex colors or arbitrary Tailwind color classes (`bg-blue-600`, `text-slate-800`) are strictly banned in application code.

### 1.1 Token Definitions

| Semantic Token             | Light Mode (OKLCH)      | Dark Mode (OKLCH)       | Usage                                  |
| -------------------------- | ----------------------- | ----------------------- | -------------------------------------- |
| `--background`             | `oklch(0.99 0.002 240)` | `oklch(0.14 0.015 255)` | Page canvas background                 |
| `--foreground`             | `oklch(0.18 0.02 260)`  | `oklch(0.96 0.005 240)` | Primary high-contrast body text        |
| `--card`                   | `oklch(1.00 0.000 0)`   | `oklch(0.18 0.02 255)`  | Surface for cards, panels, modals      |
| `--card-foreground`        | `oklch(0.18 0.02 260)`  | `oklch(0.96 0.005 240)` | Text on card surfaces                  |
| `--popover`                | `oklch(1.00 0.000 0)`   | `oklch(0.18 0.02 255)`  | Menus, dropdowns, tooltips             |
| `--popover-foreground`     | `oklch(0.18 0.02 260)`  | `oklch(0.96 0.005 240)` | Text inside popovers                   |
| `--primary`                | `oklch(0.52 0.22 262)`  | `oklch(0.64 0.20 262)`  | Primary brand action / Indigo accent   |
| `--primary-foreground`     | `oklch(0.99 0.002 240)` | `oklch(0.12 0.02 262)`  | Text/icons on primary buttons          |
| `--secondary`              | `oklch(0.94 0.01 245)`  | `oklch(0.24 0.02 255)`  | Subtle buttons, secondary badges       |
| `--secondary-foreground`   | `oklch(0.25 0.03 260)`  | `oklch(0.92 0.01 240)`  | Text on secondary elements             |
| `--muted`                  | `oklch(0.95 0.005 245)` | `oklch(0.22 0.015 255)` | Background for disabled or muted zones |
| `--muted-foreground`       | `oklch(0.50 0.02 255)`  | `oklch(0.65 0.015 250)` | Secondary text, captions, timestamps   |
| `--accent`                 | `oklch(0.94 0.015 250)` | `oklch(0.26 0.025 255)` | Hover states for list items & menus    |
| `--accent-foreground`      | `oklch(0.18 0.02 260)`  | `oklch(0.96 0.005 240)` | Text on hovered list items             |
| `--destructive`            | `oklch(0.58 0.22 25)`   | `oklch(0.52 0.22 25)`   | Critical alerts, delete actions        |
| `--destructive-foreground` | `oklch(0.99 0.002 240)` | `oklch(0.99 0.002 240)` | Text on destructive buttons            |
| `--border`                 | `oklch(0.89 0.008 245)` | `oklch(0.26 0.015 255)` | Standard card/input/divider borders    |
| `--input`                  | `oklch(0.89 0.008 245)` | `oklch(0.26 0.015 255)` | Input field boundaries                 |
| `--ring`                   | `oklch(0.52 0.22 262)`  | `oklch(0.64 0.20 262)`  | Accessible focus rings (offset 2px)    |

---

## 2. Typography Hierarchy

We standardize on three Google Fonts loaded via `@next/font/google`:

1. **Plus Jakarta Sans** (`--font-sans`):
   - Primary user interface font.
   - Used for all dashboard navigation, table headers, forms, dialogs, buttons, and metrics.
   - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
2. **Playfair Display** (`--font-serif`):
   - Editorial font.
   - Reserved strictly for public publication editorial headlines or preview views.
   - Never used for administrative UI buttons or table cells.
3. **JetBrains Mono** (`--font-mono`):
   - Technical & data font.
   - Used for code blocks, JSON viewers, API keys, UUIDs, git hashes, and URL slugs.

### 2.1 Type Scale

| Scale Token | Font Size       | Line Height    | Tracking   | Recommended Use Case                  |
| ----------- | --------------- | -------------- | ---------- | ------------------------------------- |
| `text-xs`   | 12px (0.75rem)  | 16px (1.0rem)  | `0.01em`   | Badge labels, timestamps, metadata    |
| `text-sm`   | 14px (0.875rem) | 20px (1.25rem) | `0`        | Default body, table rows, form inputs |
| `text-base` | 16px (1.00rem)  | 24px (1.50rem) | `-0.01em`  | Card subheadings, modal descriptions  |
| `text-lg`   | 18px (1.125rem) | 28px (1.75rem) | `-0.015em` | Section headers, widget titles        |
| `text-xl`   | 20px (1.25rem)  | 28px (1.75rem) | `-0.02em`  | Card headers, stat figures            |
| `text-2xl`  | 24px (1.50rem)  | 32px (2.00rem) | `-0.025em` | Page titles (`h1`), modal titles      |

---

## 3. Spacing, Layout & Grid Standards

To prevent visual noise and inconsistent alignment:

- **Base Grid**: 4px increment scale (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
- **Container Max Width**:
  - Full width dashboard canvas: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
  - Focused forms (settings, login): `max-w-xl` or `max-w-2xl`.
- **Card Padding**:
  - Compact (metrics, list items): `p-4` (16px).
  - Standard (content cards, tables): `p-6` (24px).

---

## 4. Borders, Elevation & Radius

- **Border Radius**:
  - Inputs, Buttons, Badges: `rounded-lg` (8px).
  - Cards, Modals, Popovers: `rounded-xl` (12px).
  - Avatar, Pills: `rounded-full` (9999px).
- **Elevation / Shadows**:
  - `shadow-xs`: Subtle elevation for buttons and inputs.
  - `shadow-sm`: Standard card elevation in light mode.
  - `shadow-md`: Dropdown menus, tooltips.
  - `shadow-xl`: Modal dialogs and flyout drawers.
  - Dark mode relies primarily on subtle 1px border contrast (`border-border`) rather than deep drop shadows.

---

## 5. Z-Index Layering Hierarchy

To avoid overlapping sticky headers, dialogs, and tooltips:

| Level                 | Z-Index Value | Usage                                    |
| --------------------- | ------------- | ---------------------------------------- |
| Base                  | `z-0`         | Normal document flow content             |
| Sticky                | `z-20`        | Sticky table headers, sticky action bars |
| Header Shell          | `z-30`        | Top application navigation header        |
| Sidebar               | `z-40`        | Mobile navigation drawer, fixed sidebar  |
| Overlay / Backdrop    | `z-50`        | Dialog backdrop, sheet backdrop          |
| Modal Content         | `z-50`        | DialogContent, SheetContent              |
| Popover / Dropdown    | `z-50`        | DropdownMenuContent, SelectContent       |
| Toast / Notifications | `z-60`        | Global toaster, critical alert overlays  |
