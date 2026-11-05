import { type NextRequest, NextResponse } from 'next/server';
import { fetchArticles } from '@/lib/api';
import type { PublicPostSort } from '@multi-site-cms/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim() || undefined;
    const category = searchParams.get('category')?.trim() || undefined;
    const tag = searchParams.get('tag')?.trim() || undefined;
    const sort = (searchParams.get('sort')?.trim() || undefined) as PublicPostSort | undefined;
    const page = searchParams.get('page') ? Number.parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? Number.parseInt(searchParams.get('limit')!, 10) : 12;

    const data = await fetchArticles({
      search: q,
      categorySlug: category,
      tagSlug: tag,
      sort,
      page,
      limit,
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Air Sports Search API] Error executing search:', error);
    return NextResponse.json(
      { items: [], total: 0, page: 1, limit: 12, totalPages: 1 },
      { status: 500 },
    );
  }
}
