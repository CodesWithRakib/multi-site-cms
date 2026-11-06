import type { EventItem, EventStatus } from '@multi-site-cms/types';

import type { EventPayload } from '@/lib/cms-api';

export const EVENT_STATUS_OPTIONS: readonly { value: EventStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live now' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Form state: dates are `<input type="datetime-local">` values in the editor's time zone. */
export interface EventFormValues {
  name: string;
  slug: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  description: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** ISO timestamp → `YYYY-MM-DDTHH:mm` in the browser's local time zone. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** `datetime-local` value (local time) → ISO timestamp, or null when empty/invalid. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** URL slug from an event name: "Shakrain Festival 2027" → "shakrain-festival-2027". */
export function slugifyEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function initialEventValues(event: EventItem | null): EventFormValues {
  return {
    name: event?.name ?? '',
    slug: event?.slug ?? '',
    status: event?.status ?? 'scheduled',
    startsAt: toLocalInputValue(event?.startsAt ?? null),
    endsAt: toLocalInputValue(event?.endsAt ?? null),
    description: event?.description ?? '',
  };
}

export type EventFormResult =
  | { readonly ok: true; readonly payload: EventPayload }
  | { readonly ok: false; readonly error: string };

/** Validates the form and builds the API payload. Mirrors the server's rules. */
export function buildEventPayload(values: EventFormValues): EventFormResult {
  const name = values.name.trim();
  if (!name) return { ok: false, error: 'Event name is required.' };

  const slug = (values.slug.trim() || slugifyEventName(name)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: 'Slug may only contain lowercase letters, numbers and hyphens.' };
  }

  const startsAt = fromLocalInputValue(values.startsAt);
  if (!startsAt) return { ok: false, error: 'Start date and time are required.' };

  const endsAt = fromLocalInputValue(values.endsAt);
  if (values.endsAt && !endsAt) return { ok: false, error: 'End date is not a valid date.' };
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    return { ok: false, error: 'The event cannot end before it starts.' };
  }

  return {
    ok: true,
    payload: {
      name,
      slug,
      status: values.status,
      startsAt,
      endsAt,
      description: values.description.trim() || null,
    },
  };
}
