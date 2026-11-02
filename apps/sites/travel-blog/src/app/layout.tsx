import type { Metadata, Viewport } from 'next';
import { Caveat, JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { siteConfig } from '@/config/site';

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
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sansFont.variable} ${serifFont.variable} ${handwritingFont.variable} ${monoFont.variable} min-h-dvh flex flex-col bg-background font-sans antialiased text-foreground`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
