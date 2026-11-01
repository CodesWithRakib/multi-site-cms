'use client';

import type { Store } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

export interface StoreProviderProps {
  store: Store;
  children: ReactNode;
}

export function StoreProvider({ store, children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
