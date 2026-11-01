import type {
  ListPublicPostsQuery,
  PaginatedResult,
  PublicArticleDetail,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventDetail,
  PublicEventSummary,
  PublicSitemapItem,
  PublicTagItem,
} from '@multi-site-cms/types';

export const SITE_KEY = 'air-sports';

const API_BASE_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const url = new URL(`${API_BASE_URL}/public/sites/${SITE_KEY}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Fetch published articles / updates for Air Sports.
 */
export async function fetchArticles(
  params?: ListPublicPostsQuery,
): Promise<PaginatedResult<PublicArticleSummary>> {
  const emptyResult: PaginatedResult<PublicArticleSummary> = {
    items: [],
    total: 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 12,
    totalPages: 1,
  };

  try {
    const url = buildUrl('/posts', params as Record<string, unknown>);
    const res = await fetch(url, {
      next: {
        revalidate: 30,
        tags: ['air-sports-content'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) return emptyResult;
      console.warn(`[Air Sports API] Fetch articles returned ${res.status}`);
      return emptyResult;
    }

    const json = (await res.json()) as {
      data: PublicArticleSummary[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };

    return {
      items: json.data || [],
      total: json.pagination?.total || 0,
      page: json.pagination?.page || 1,
      limit: json.pagination?.limit || 12,
      totalPages: json.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch articles:', error);
    return emptyResult;
  }
}

/**
 * Fetch single published article or live update by slug.
 */
export async function fetchArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  try {
    const url = buildUrl(`/posts/${encodeURIComponent(slug)}`);
    const res = await fetch(url, {
      next: {
        revalidate: 30,
        tags: ['air-sports-content', `air-sports-post-${slug}`],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as { data: PublicArticleDetail };
    return json.data || null;
  } catch (error) {
    console.warn(`[Air Sports API] Failed to fetch article ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch active air sports events with update counts.
 */
export async function fetchEvents(): Promise<PublicEventSummary[]> {
  try {
    const url = buildUrl('/events');
    const res = await fetch(url, {
      next: {
        revalidate: 60,
        tags: ['air-sports-content', 'air-sports-events'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as { data: PublicEventSummary[] };
    return json.data || [];
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch events:', error);
    return [];
  }
}

/**
 * Fetch event details with its timeline of published updates by slug.
 */
export async function fetchEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  try {
    const url = buildUrl(`/events/${encodeURIComponent(slug)}`);
    const res = await fetch(url, {
      next: {
        revalidate: 30,
        tags: ['air-sports-content', `air-sports-event-${slug}`],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { data: PublicEventDetail };
    return json.data || null;
  } catch (error) {
    console.warn(`[Air Sports API] Failed to fetch event ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch active categories for Air Sports.
 */
export async function fetchCategories(): Promise<PublicCategoryItem[]> {
  try {
    const url = buildUrl('/categories');
    const res = await fetch(url, {
      next: {
        revalidate: 300,
        tags: ['air-sports-content', 'air-sports-categories'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as { data: PublicCategoryItem[] };
    return json.data || [];
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Fetch active tags for Air Sports.
 */
export async function fetchTags(): Promise<PublicTagItem[]> {
  try {
    const url = buildUrl('/tags');
    const res = await fetch(url, {
      next: {
        revalidate: 300,
        tags: ['air-sports-content', 'air-sports-tags'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as { data: PublicTagItem[] };
    return json.data || [];
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch tags:', error);
    return [];
  }
}

/**
 * Fetch sitemap index entries.
 */
export async function fetchSitemapEntries(): Promise<PublicSitemapItem[]> {
  try {
    const url = buildUrl('/sitemap');
    const res = await fetch(url, {
      next: {
        revalidate: 600,
        tags: ['air-sports-content'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as { data: PublicSitemapItem[] };
    return json.data || [];
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch sitemap entries:', error);
    return [];
  }
}

/**
 * Fetch authenticated draft preview with signed token.
 */
export async function fetchDraftPreview(
  postId: string,
  token: string,
): Promise<PublicArticleDetail | null> {
  try {
    const url = buildUrl(`/preview/${encodeURIComponent(postId)}`, { token });
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { data: PublicArticleDetail };
    return json.data || null;
  } catch (error) {
    console.warn(`[Air Sports API] Failed to fetch preview for ${postId}:`, error);
    return null;
  }
}
