'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button, StatusPage } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

interface RouteErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Route-level error boundary. Never renders `error.message`; the digest lets
 * operators correlate with server logs.
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  const { t } = useAdmin();

  useEffect(() => {
    console.error('[admin route error]', error.digest ?? error.name);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <StatusPage
        title={t.boundary.errorTitle}
        description={t.boundary.errorDesc}
        actions={
          <>
            <Button type="button" onClick={reset}>
              {t.boundary.retry}
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t.auth.returnHome}</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
