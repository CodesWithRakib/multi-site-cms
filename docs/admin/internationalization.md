# Admin Internationalization & Localization

## 1. Overview

The administrative dashboard provides bilingual localization for **English (`en`)** and **Bangla (`bn`)**.

---

## 2. Architecture & Types

The dictionary is located in `apps/admin/src/lib/i18n.ts` and structured as:

```typescript
export type Locale = 'en' | 'bn';

export type TranslationDictionary = {
  [K in keyof typeof translations.en]: {
    [P in keyof (typeof translations.en)[K]]: string;
  };
};

export type TranslateFunction = {
  (path: string): string;
} & TranslationDictionary;
```

### Dual-Access Pattern

To provide maximum ergonomic flexibility and full TypeScript autocomplete:

1. **Property Access**: `t.dashboard.title`, `t.actions.save`, `t.nav.calendar`.
2. **Function Path Access**: `t('users.title')`, `t('taxonomy.newCategory')`.

Both access patterns are supported by `AdminContext.t`.

---

## 3. Scope of Localization

Every visual domain is localized:

- **Navigation & Shell**: Sidebar links, account menu, status indicators.
- **Common Actions**: Create, Save, Save Draft, Publish Now, Schedule, Reschedule, Unpublish, Archive, Restore, Delete.
- **Statuses**: Draft, In Review, Scheduled, Published, Archived, Active, Suspended, Verified.
- **Dashboard Overview**: Metrics titles, publishing telemetry headers, quick action buttons.
- **Editorial Workspace**: Table headers, type filters, publication status labels.
- **Publishing Dialogs**: Modal titles, description explanations, target time labels, cancellation confirmations.
- **Media Asset Library**: Upload dropzone instructions, metadata edit labels, deletion warnings.
- **Site Registry & Domains**: Form field labels, DNS challenge instructions.
- **User & Role Administration**: Role descriptions, protection notices, status toggles.
- **Taxonomy**: Categories, Tags, display order labels.
- **Authentication**: Login headings, form labels, 403 unauthorized explanations.

---

## 4. Timezone-Aware DateTime Formatting

Date display avoids local client skew using `formatDateTime`:

```typescript
export function formatDateTime(
  dateInput: string | Date | null | undefined,
  locale: Locale = 'en',
  timezone = 'UTC',
): string;
```

This helper wraps native `Intl.DateTimeFormat`:

- When `locale === 'bn'`, formats using `bn-BD` numerals and month names.
- Uses the site's explicit target `timezone` (e.g. `Asia/Dhaka`).
- Returns `'—'` for null or empty values.
