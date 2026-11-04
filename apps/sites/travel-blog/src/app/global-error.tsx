'use client';

import { Button, StatusPage } from '@multi-site-cms/ui';

import './globals.css';

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * whole document, so it renders its own <html> and <body> and avoids anything
 * that depends on the layout (header, theme provider, fonts).
 */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <StatusPage
          title="Something went wrong"
          description="The site could not be loaded. Please try again."
          actions={
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}
