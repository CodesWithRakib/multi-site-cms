import { type NextRequest, NextResponse } from 'next/server';

import { fetchArticlesResult } from '@/lib/api';
import { nextToken, parseFeedRequest } from '@/lib/feed-request';

export const dynamic = 'force-dynamic';

/**
 * Next batch of stories for the infinite-scroll feed. Input is validated here
 * (search text, filters, cursor and page go to the CMS API as query
 * parameters), and only the fields the feed needs are returned.
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
  // A failed upstream call must not look like "no more stories": the feed would
  // stop loading and hide the rest. Report it so the reader can retry.
  if (!result.ok) {
    return NextResponse.json({ error: 'Stories are unavailable right now' }, { status: 502 });
  }

  const { data } = result;
  return NextResponse.json(
    { items: data.items, total: data.total, next: nextToken(data, state.sort) },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
  );
}
