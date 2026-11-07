import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, StatusPage } from '@multi-site-cms/ui';

import { EmptyStateArt } from '@/components/illustrations/EmptyStateArt';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusPage
      illustration={<EmptyStateArt name="lost" className="mx-auto h-40 w-auto sm:h-48" />}
      code="404"
      title="We couldn’t find that page"
      description="It may have been moved, unpublished, or the link may be mistyped. Try searching, or start again from the home page."
      actions={
        <>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/articles#search">Search stories</Link>
          </Button>
        </>
      }
    />
  );
}
