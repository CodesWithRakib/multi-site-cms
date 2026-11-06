'use client';

import React, { useState } from 'react';
import { AlertCircle, CalendarPlus, CalendarX2, Loader2, RefreshCw } from 'lucide-react';
import { NativeSelect } from '@multi-site-cms/ui';
import type { EventItem } from '@multi-site-cms/types';

import { ConfirmDialog } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { EventList, EventModal } from '@/features/events';
import { apiErrorMessage } from '@/lib/api-error';
import { useAdmin } from '@/lib/admin-context';
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useListEventsQuery,
  useUpdateEventMutation,
  type EventPayload,
} from '@/lib/cms-api';

export default function EventsPage() {
  const { activeSiteId, availableSites, setActiveSiteId, can } = useAdmin();
  const siteId = activeSiteId || availableSites[0]?.id || '';
  const canManage = Boolean(siteId) && can('event:manage', siteId);

  const {
    data: events = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListEventsQuery(siteId, { skip: !siteId });
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventItem | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSave = async (payload: EventPayload) => {
    if (editing) {
      await updateEvent({ siteId, eventId: editing.id, data: payload }).unwrap();
      setNotice({ tone: 'success', text: `“${payload.name}” updated.` });
    } else {
      await createEvent({ siteId, data: payload }).unwrap();
      setNotice({ tone: 'success', text: `“${payload.name}” created.` });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteEvent({ siteId, eventId: pendingDelete.id }).unwrap();
      setNotice({ tone: 'success', text: `“${pendingDelete.name}” deleted.` });
    } catch (err: unknown) {
      setNotice({ tone: 'error', text: apiErrorMessage(err, 'Could not delete the event.') });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Events</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Competitions, festivals and meets. Posts can be linked to an event from the post
              editor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {availableSites.length > 1 && (
              <NativeSelect
                id="events-site-scope"
                aria-label="Website"
                value={siteId}
                onValueChange={setActiveSiteId}
                options={availableSites.map((site) => ({ value: site.id, label: site.name }))}
                className="w-auto rounded-xl border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            )}
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-600"
              >
                <CalendarPlus className="size-4" aria-hidden="true" />
                New event
              </button>
            )}
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold ${
              notice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {!siteId ? (
            <EmptyState title="No website available" text="You do not manage any website yet." />
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading events…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <AlertCircle className="size-6 text-rose-500" aria-hidden="true" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Events could not be loaded.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-700"
              >
                <RefreshCw
                  className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Try again
              </button>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No events yet"
              text={
                canManage
                  ? 'Create the first event, then link posts to it from the editor.'
                  : 'Nothing is scheduled for this website.'
              }
            />
          ) : (
            <EventList
              events={events}
              canManage={canManage}
              onEdit={(event) => {
                setEditing(event);
                setModalOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          )}
        </section>
      </div>

      <EventModal
        isOpen={modalOpen}
        editingEvent={editing}
        isSaving={isCreating || isUpdating}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this event?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” is removed from the site. ${
                pendingDelete.publicationCount > 0
                  ? `Its ${pendingDelete.publicationCount} linked post(s) stay published and are simply unlinked.`
                  : ''
              }`
            : ''
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        tone="danger"
        isBusy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </ShellLayout>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center">
      <CalendarX2 className="size-7 text-slate-300 dark:text-slate-600" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
