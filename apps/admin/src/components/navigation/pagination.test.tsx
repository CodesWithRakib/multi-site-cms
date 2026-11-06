import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StoreProvider } from '@multi-site-cms/redux';

import { AdminProvider } from '@/lib/admin-context';
import { makeStore } from '@/lib/store';

import { CursorPagination } from './CursorPagination';
import { Pagination } from './Pagination';

/** SSR separates adjacent text nodes with comment markers; strip them for assertions. */
function render(element: React.ReactElement): string {
  return stripMarkers(
    renderToString(
      <StoreProvider store={makeStore()}>
        <AdminProvider>{element}</AdminProvider>
      </StoreProvider>,
    ),
  );
}

function stripMarkers(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

const noop = () => undefined;

describe('Pagination', () => {
  it('shows the item range, a size selector and the windowed page list', () => {
    const html = render(
      <Pagination
        page={5}
        totalPages={20}
        total={400}
        pageSize={20}
        itemLabel="posts"
        onPageChange={noop}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={noop}
      />,
    );

    expect(html).toContain('81');
    expect(html).toContain('100');
    expect(html).toContain('400 posts');
    expect(html).toContain('Rows per page');
    // Current page is marked, distant pages collapse.
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('…');
    expect(html).toContain('aria-label="Last page"');
  });

  it('renders nothing for an empty list, or one short page with no size choice', () => {
    const empty = render(
      <Pagination
        page={1}
        totalPages={1}
        total={0}
        pageSize={20}
        itemLabel="posts"
        onPageChange={noop}
      />,
    );
    const single = render(
      <Pagination
        page={1}
        totalPages={1}
        total={5}
        pageSize={20}
        itemLabel="posts"
        onPageChange={noop}
      />,
    );
    expect(empty).not.toContain('<nav');
    expect(single).not.toContain('<nav');
  });

  it('keeps the size selector when one page still exceeds the smallest size', () => {
    const html = render(
      <Pagination
        page={1}
        totalPages={1}
        total={15}
        pageSize={20}
        itemLabel="users"
        onPageChange={noop}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={noop}
      />,
    );
    expect(html).toContain('Rows per page');
    expect(html).not.toContain('aria-label="Last page"');
  });
});

describe('CursorPagination', () => {
  const base = {
    shown: 20,
    total: 398,
    itemLabel: 'events',
    onNewer: noop,
    onOlder: noop,
    onLatest: noop,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
    onPageSizeChange: noop,
  } as const;

  it('offers Older/Newer instead of page numbers and disables the unavailable direction', () => {
    const html = render(<CursorPagination {...base} hasNewer={false} hasOlder />);
    expect(html).toContain('Older');
    expect(html).toContain('Newer');
    expect(html).toContain('398 events');
    expect(html).not.toContain('aria-current="page"');
    // "Newer" and "Latest" are disabled on the newest page.
    expect(html.match(/disabled=""/g)?.length).toBe(2);
  });

  it('renders nothing when there are no rows', () => {
    expect(
      render(<CursorPagination {...base} total={0} hasNewer={false} hasOlder={false} />),
    ).not.toContain('<nav');
  });
});
