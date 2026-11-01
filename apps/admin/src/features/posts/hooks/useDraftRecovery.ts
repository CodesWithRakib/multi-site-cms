'use client';

import { useEffect, useState, useCallback } from 'react';

export interface DraftSnapshot<T> {
  savedAt: string;
  data: T;
}

export function useDraftRecovery<T>(postId: string, currentData: T, isDirty: boolean) {
  const storageKey = `cms_draft_${postId}`;
  const [recoverableDraft, setRecoverableDraft] = useState<DraftSnapshot<T> | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftSnapshot<T>;
        if (parsed && parsed.data) {
          return parsed;
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return null;
  });

  // Persist draft snapshot to sessionStorage when dirty
  useEffect(() => {
    if (typeof window === 'undefined' || !isDirty) return;

    try {
      const snapshot: DraftSnapshot<T> = {
        savedAt: new Date().toISOString(),
        data: currentData,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors
    }
  }, [storageKey, currentData, isDirty]);

  // Warn on tab close / reload if unsaved changes exist
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(storageKey);
      setRecoverableDraft(null);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return {
    recoverableDraft,
    hasRecoverableDraft: recoverableDraft !== null,
    clearDraft,
  };
}
