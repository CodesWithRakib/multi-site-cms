'use client';

import React, { useState } from 'react';
import { CalendarClock, Loader2, X } from 'lucide-react';
import { NativeSelect } from '@multi-site-cms/ui';
import type { EventItem, EventStatus } from '@multi-site-cms/types';

import { apiErrorMessage } from '@/lib/api-error';
import type { EventPayload } from '@/lib/cms-api';
import {
  buildEventPayload,
  EVENT_STATUS_OPTIONS,
  initialEventValues,
  slugifyEventName,
  type EventFormValues,
} from '../utils/event-form';

interface EventModalProps {
  readonly isOpen: boolean;
  readonly editingEvent: EventItem | null;
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: EventPayload) => Promise<void>;
}

/** Create / edit dialog. Keyed by event so each open starts from fresh state. */
export function EventModal({ isOpen, editingEvent, ...rest }: EventModalProps) {
  if (!isOpen) return null;
  return (
    <EventModalContent key={editingEvent?.id ?? 'new'} editingEvent={editingEvent} {...rest} />
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

function EventModalContent({
  editingEvent,
  isSaving,
  onClose,
  onSave,
}: Omit<EventModalProps, 'isOpen'>) {
  const [values, setValues] = useState<EventFormValues>(() => initialEventValues(editingEvent));
  const [slugTouched, setSlugTouched] = useState(Boolean(editingEvent));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = buildEventPayload(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      await onSave(result.payload);
      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Could not save the event.'));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <CalendarClock className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="event-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {editingEvent ? 'Edit event' : 'New event'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shown on the site&apos;s events page; posts can report on it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="event-name" className={labelClass}>
              Name *
            </label>
            <input
              id="event-name"
              value={values.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (!slugTouched) set('slug', slugifyEventName(e.target.value));
              }}
              placeholder="e.g. Shakrain Festival 2027"
              maxLength={160}
              required
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-slug" className={labelClass}>
                Slug
              </label>
              <input
                id="event-slug"
                value={values.slug}
                onChange={(e) => {
                  set('slug', e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="shakrain-festival-2027"
                maxLength={120}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="event-status" className={labelClass}>
                Status
              </label>
              <NativeSelect
                id="event-status"
                value={values.status}
                onValueChange={(value) => set('status', value as EventStatus)}
                options={EVENT_STATUS_OPTIONS.map((option) => ({ ...option }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-starts" className={labelClass}>
                Starts *
              </label>
              <input
                id="event-starts"
                type="datetime-local"
                value={values.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="event-ends" className={labelClass}>
                Ends <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="event-ends"
                type="datetime-local"
                value={values.endsAt}
                min={values.startsAt || undefined}
                onChange={(e) => set('endsAt', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="event-description"
              rows={3}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={2000}
              placeholder="Where, who takes part, what to expect…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              {isSaving ? 'Saving…' : editingEvent ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
