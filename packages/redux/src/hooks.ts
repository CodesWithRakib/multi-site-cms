'use client';

import type { Store } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Build the typed Redux hooks for a concrete application store. This keeps
 * `RootState` and `AppDispatch` inference available without putting app-specific
 * types into the shared package.
 */
export function createTypedHooks<TStore extends Store>() {
  return {
    useAppDispatch: useDispatch.withTypes<TStore['dispatch']>(),
    useAppSelector: useSelector.withTypes<ReturnType<TStore['getState']>>(),
  };
}
