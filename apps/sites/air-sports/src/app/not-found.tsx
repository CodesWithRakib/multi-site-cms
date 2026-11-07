import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, StatusPage } from '@multi-site-cms/ui';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We couldn’t find that page"
      description="It may have been moved, unpublished, or the link may be mistyped. Try searching, or start again from the home page."
      actions={
        <>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/articles#search">Search dispatches</Link>
          </Button>
        </>
      }
    />
  );
}
