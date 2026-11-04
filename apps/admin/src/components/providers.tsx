'use client';

import { StoreProvider } from '@multi-site-cms/redux';
import { useState, type ReactNode } from 'react';

import { AdminProvider } from '@/lib/admin-context';
import { makeStore } from '@/lib/store';
import { ThemeProvider } from '@multi-site-cms/ui';

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <ThemeProvider storageKey="multi_site_cms_admin_theme">
      <StoreProvider store={store}>
        <AdminProvider>{children}</AdminProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
