import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Caveat, JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppTabBar } from '@/components/layout/AppTabBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { siteConfig } from '@/config/site';

import {
  SkipLink,
  siteThemeColors,
  siteThemeStyle,
  ThemeProvider,
  themeInitScript,
} from '@multi-site-cms/ui';

import './globals.css';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const serifFont = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const handwritingFont = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-handwriting',
  weight: ['500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  // Home-screen install behaves like a native app (ADR-0027).
  appleWebApp: { capable: true, title: 'Travel', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
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
  colorScheme: 'light dark',
  themeColor: siteThemeColors('travel-blog'),
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-site="travel-blog"
      style={siteThemeStyle('travel-blog')}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript('travel_blog_theme')}
        </Script>
      </head>
      <body
        className={`${sansFont.variable} ${serifFont.variable} ${handwritingFont.variable} ${monoFont.variable} min-h-dvh flex flex-col bg-background pb-tabbar md:pb-0 font-sans antialiased text-foreground`}
      >
        <ThemeProvider storageKey="travel_blog_theme">
          <SkipLink />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <AppTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
