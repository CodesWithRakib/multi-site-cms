import { configureStore } from '@reduxjs/toolkit';

import type { PlatformApi } from './platform-api';

/**
 * Store factory instead of a module-level singleton. The admin provider creates
 * one store per React tree, avoiding mutable state leaking between server
 * requests during SSR.
 */
export function createAppStore(api: PlatformApi) {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
