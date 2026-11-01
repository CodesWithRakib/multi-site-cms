import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import { publicConfig } from '@/config/env';
import { platformConfig } from '@/config/platform';

import './globals.css';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sansFont.variable} ${monoFont.variable} min-h-dvh bg-background font-sans antialiased text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
