import Link from 'next/link';

import { PaginationLinks } from '@multi-site-cms/ui';

import { searchHref, type SearchState } from '@/lib/search-params';

interface SearchPaginationProps {
  readonly state: SearchState;
  readonly totalPages: number;
}

/** Search result pages: every page is a real, shareable URL that keeps the filters. */
export function SearchPagination({ state, totalPages }: SearchPaginationProps) {
  return (
    <PaginationLinks
      page={state.page}
      totalPages={totalPages}
      hrefFor={(page) => searchHref(state, { page })}
      linkComponent={Link}
      label="Search result pages"
    />
  );
}
