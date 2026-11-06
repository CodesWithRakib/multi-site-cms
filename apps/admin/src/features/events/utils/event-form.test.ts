import { describe, expect, it } from 'vitest';

import {
  buildEventPayload,
  fromLocalInputValue,
  initialEventValues,
  slugifyEventName,
  toLocalInputValue,
  type EventFormValues,
} from './event-form';

const base: EventFormValues = {
  name: 'Shakrain Festival 2027',
  slug: '',
  status: 'scheduled',
  startsAt: '2027-01-14T09:00',
  endsAt: '2027-01-14T21:00',
  description: '  Kites over Old Dhaka.  ',
};

describe('event form', () => {
  it('round-trips datetime-local values through ISO', () => {
    const iso = fromLocalInputValue('2027-01-14T09:30');
    expect(iso).not.toBeNull();
    expect(toLocalInputValue(iso)).toBe('2027-01-14T09:30');
    expect(fromLocalInputValue('')).toBeNull();
    expect(toLocalInputValue(null)).toBe('');
  });

  it('slugifies names', () => {
    expect(slugifyEventName('Shakrain Festival 2027!')).toBe('shakrain-festival-2027');
  });

  it('builds a payload, deriving the slug and trimming text', () => {
    const result = buildEventPayload(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload).toMatchObject({
      name: 'Shakrain Festival 2027',
      slug: 'shakrain-festival-2027',
      status: 'scheduled',
      description: 'Kites over Old Dhaka.',
    });
    expect(result.payload.endsAt).not.toBeNull();
  });

  it('allows an open-ended event', () => {
    const result = buildEventPayload({ ...base, endsAt: '' });
    expect(result.ok && result.payload.endsAt).toBeNull();
  });

  it('rejects missing names, bad slugs, missing starts and reversed ranges', () => {
    expect(buildEventPayload({ ...base, name: ' ' }).ok).toBe(false);
    expect(buildEventPayload({ ...base, slug: 'Bad Slug' }).ok).toBe(false);
    expect(buildEventPayload({ ...base, startsAt: '' }).ok).toBe(false);
    expect(buildEventPayload({ ...base, endsAt: '2027-01-13T09:00' }).ok).toBe(false);
  });

  it('prefills the form from an existing event', () => {
    const values = initialEventValues({
      id: 'e1',
      siteId: 's1',
      slug: 'meet',
      name: 'Meet',
      status: 'live',
      startsAt: new Date(2027, 0, 14, 9, 0).toISOString(),
      endsAt: null,
      description: null,
      publicationCount: 0,
      createdAt: '',
      updatedAt: '',
    });
    expect(values).toMatchObject({ slug: 'meet', status: 'live', startsAt: '2027-01-14T09:00' });
    expect(values.endsAt).toBe('');
  });
});
