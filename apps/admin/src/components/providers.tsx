'use client';

import { StoreProvider } from '@multi-site-cms/redux';
import { useState, type ReactNode } from 'react';

import { AdminProvider } from '@/lib/admin-context';
import { makeStore } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <StoreProvider store={store}>
      <AdminProvider>{children}</AdminProvider>
    </StoreProvider>
  );
}
