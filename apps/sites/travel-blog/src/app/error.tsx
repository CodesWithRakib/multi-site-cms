'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button, StatusPage } from '@multi-site-cms/ui';

import { EmptyStateArt } from '@/components/illustrations/EmptyStateArt';

interface RouteErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Route-level error boundary. Never renders `error.message`: in production it
 * can contain server details. The digest lets operators find the server log.
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error('[route error]', error.digest ?? error.name);
  }, [error]);

  return (
    <StatusPage
      illustration={<EmptyStateArt name="lost" className="mx-auto h-36 w-auto" />}
      title="Something went wrong"
      description="This page could not be loaded right now. Please try again in a moment."
      actions={
        <>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </>
      }
    />
  );
}
