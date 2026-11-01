'use client';

import { StoreProvider } from '@multi-site-cms/redux';
import { useState, type ReactNode } from 'react';

import { makeStore } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return <StoreProvider store={store}>{children}</StoreProvider>;
}
