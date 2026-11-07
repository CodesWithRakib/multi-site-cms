import { type NextRequest, NextResponse } from 'next/server';

import { nextToken, parseFeedRequest } from '@multi-site-cms/ui';

import { fetchArticlesResult } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Next batch of dispatches for the infinite-scroll list. Input is validated
 * here (search text, filters, cursor and page go to the CMS API as query
 * parameters), and only the fields the list needs are returned.
 */
export async function GET(request: NextRequest) {
  const parsed = parseFeedRequest(request.nextUrl.searchParams);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { state, next, limit } = parsed;

  const result = await fetchArticlesResult({
    limit,
    search: state.q || undefined,
    categorySlug: state.category || undefined,
    tagSlug: state.tag || undefined,
    sort: state.sort,
    cursor: next?.kind === 'cursor' ? next.value : undefined,
    page: next?.kind === 'page' ? next.value : undefined,
  });
  // A failed upstream call must not look like "no more dispatches": the list would
  // stop loading and hide the rest. Report it so the reader can retry.
  if (!result.ok) {
    return NextResponse.json({ error: 'Dispatches are unavailable right now' }, { status: 502 });
  }

  const { data } = result;
  return NextResponse.json(
    { items: data.items, total: data.total, next: nextToken(data, state.sort) },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
  );
}
