import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import { publicConfig } from '@/config/env';
import { platformConfig } from '@/config/platform';

import { siteThemeColors, siteThemeStyle, themeInitScript } from '@multi-site-cms/ui';

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
  // Home-screen install behaves like a native app (ADR-0027).
  appleWebApp: { capable: true, title: 'CMS Admin', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
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
  colorScheme: 'light dark',
  themeColor: siteThemeColors('admin'),
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-site="admin" style={siteThemeStyle('admin')} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript('multi_site_cms_admin_theme')}
        </Script>
      </head>
      <body
        className={`${sansFont.variable} ${monoFont.variable} min-h-dvh bg-background font-sans antialiased text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
