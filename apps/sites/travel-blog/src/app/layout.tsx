import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { siteConfig } from '@/config/site';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
