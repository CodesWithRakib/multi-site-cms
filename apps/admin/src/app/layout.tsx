import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import { publicConfig } from '@/config/env';
import { platformConfig } from '@/config/platform';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.appUrl),
  title: {
    default: `${platformConfig.name} — Admin`,
    template: `%s | ${platformConfig.name}`,
  },
  description: platformConfig.description,
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#312e81',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
