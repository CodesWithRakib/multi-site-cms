'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { AutosaveScheduler } from './autosave-scheduler';

export type AutosaveStatus = 'saved' | 'unsaved' | 'saving' | 'failed' | 'offline';

export interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  /** Longest time changes stay unsaved while typing continues (platform setting). */
  maxWaitMs?: number;
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 2000,
  maxWaitMs = 30_000,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const schedulerRef = useRef<AutosaveScheduler | null>(null);

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'offline') setStatus(isDirty ? 'unsaved' : 'saved');
    };
    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, isDirty]);

  const executeSave = useCallback(
    async (payloadToSave: T) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');
        return;
      }

      setStatus('saving');
      setConflictError(null);

      try {
        await onSave(payloadToSave);
        setStatus('saved');
        setLastSavedAt(new Date());
        setIsDirty(false);
      } catch (err: unknown) {
        setStatus('failed');
        const apiErr = err as { status?: number; code?: string; message?: string };
        if (apiErr.status === 409 || apiErr.code === 'CONFLICT') {
          setConflictError(
            'Version conflict: Another editor has saved a newer revision of this post. Please review changes before overwriting.',
          );
        }
      }
    },
    [onSave],
  );

  useEffect(() => {
    const scheduler = new AutosaveScheduler(
      () => void executeSave(dataRef.current),
      debounceMs,
      Math.max(debounceMs, maxWaitMs),
    );
    schedulerRef.current = scheduler;
    return () => scheduler.cancel();
  }, [debounceMs, maxWaitMs, executeSave]);

  // Trigger immediate manual save
  const triggerManualSave = useCallback(async () => {
    schedulerRef.current?.cancel();
    await executeSave(dataRef.current);
  }, [executeSave]);

  // Mark dirty and schedule debounce
  const markDirty = useCallback(() => {
    if (!enabled) return;
    setIsDirty(true);
    setStatus('unsaved');

    schedulerRef.current?.touch();
  }, [enabled]);

  // Global Ctrl+S / Cmd+S shortcut to save immediately
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void triggerManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, triggerManualSave]);

  return {
    status,
    lastSavedAt,
    conflictError,
    markDirty,
    triggerManualSave,
    isDirty,
  };
}
