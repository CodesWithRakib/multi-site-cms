'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type AutosaveStatus = 'saved' | 'saving' | 'failed' | 'offline';

export interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 2000,
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'offline') setStatus(isDirty ? 'failed' : 'saved');
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

  // Trigger immediate manual save
  const triggerManualSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await executeSave(dataRef.current);
  }, [executeSave]);

  // Mark dirty and schedule debounce
  const markDirty = useCallback(() => {
    if (!enabled) return;
    setIsDirty(true);
    setStatus('failed'); // Pending save

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void executeSave(dataRef.current);
    }, debounceMs);
  }, [debounceMs, enabled, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSavedAt,
    conflictError,
    markDirty,
    triggerManualSave,
    isDirty,
  };
}
