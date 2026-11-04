'use client';

import Link from 'next/link';

import { Button, StatusPage } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

export default function NotFound() {
  const { t } = useAdmin();

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <StatusPage
        code="404"
        title={t.boundary.notFoundTitle}
        description={t.boundary.notFoundDesc}
        actions={
          <Button asChild>
            <Link href="/">{t.auth.returnHome}</Link>
          </Button>
        }
      />
    </div>
  );
}
