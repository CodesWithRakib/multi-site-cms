import type {
  CursorPage,
  ListPublicPostsQuery,
  PublicArticleDetail,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventDetail,
  PublicEventSummary,
  PublicSiteConfig,
  PublicSitemapItem,
  PublicTagItem,
} from '@multi-site-cms/types';
import { apiTimeoutSignal } from './api-timeout';

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

export type ArticlesResult =
  { readonly ok: true; readonly data: CursorPage<PublicArticleSummary> } | { readonly ok: false };

function emptyPage(params?: ListPublicPostsQuery): CursorPage<PublicArticleSummary> {
  return {
    items: [],
    total: 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 12,
    totalPages: 1,
    nextCursor: null,
  };
}

/**
 * Published articles / updates for Air Sports, with page or cursor paging.
 * Unlike `fetchArticles` it says whether the CMS answered, so a caller that
 * appends to a list (infinite scroll) can tell "no more" from "failed".
 */
export async function fetchArticlesResult(params?: ListPublicPostsQuery): Promise<ArticlesResult> {
  try {
    const url = buildUrl('/posts', params as Record<string, unknown>);
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 30,
        tags: ['air-sports-content'],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      // An unknown site is simply empty; anything else is a failure.
      if (res.status === 404) return { ok: true, data: emptyPage(params) };
      console.warn(`[Air Sports API] Fetch articles returned ${res.status}`);
      return { ok: false };
    }

    const json = (await res.json()) as {
      data: PublicArticleSummary[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        nextCursor?: string | null;
      };
    };

    return {
      ok: true,
      data: {
        items: json.data || [],
        total: json.pagination?.total || 0,
        page: json.pagination?.page || 1,
        limit: json.pagination?.limit || 12,
        totalPages: json.pagination?.totalPages || 1,
        nextCursor: json.pagination?.nextCursor ?? null,
      },
    };
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch articles:', error);
    return { ok: false };
  }
}

/** Published articles, or an empty page when the CMS cannot be reached. */
export async function fetchArticles(
  params?: ListPublicPostsQuery,
): Promise<CursorPage<PublicArticleSummary>> {
  const result = await fetchArticlesResult(params);
  return result.ok ? result.data : emptyPage(params);
}

/**
 * Fetch single article detail by slug.
 */
export async function fetchArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  try {
    const url = buildUrl(`/posts/${encodeURIComponent(slug)}`);
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 30,
        tags: ['air-sports-content', `post-${slug}`],
      },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { data: PublicArticleDetail };
    return json.data || null;
  } catch (error) {
    console.warn(`[Air Sports API] Failed to fetch article ${slug}:`, error);
    return null;
  }
}

/**
 * Public site configuration, including the owner-written About page.
 * Null when the API is unreachable so pages fall back to neutral defaults.
 */
export async function fetchSiteConfig(): Promise<PublicSiteConfig | null> {
  try {
    const res = await fetch(buildUrl('/config'), {
      signal: apiTimeoutSignal(),
      next: { revalidate: 300, tags: ['air-sports-config'] },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicSiteConfig };
    return json.data ?? null;
  } catch (error) {
    console.warn('[Air Sports API] Failed to fetch site config:', error);
    return null;
  }
}

/**
 * Fetch scheduled and active events.
 */
export async function fetchEvents(): Promise<PublicEventSummary[]> {
  try {
    const url = buildUrl('/events');
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 30,
        tags: ['air-sports-events'],
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
 * Fetch single event detail with live updates.
 */
export async function fetchEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  try {
    const url = buildUrl(`/events/${encodeURIComponent(slug)}`);
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 15,
        tags: ['air-sports-events', `event-${slug}`],
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
 * Fetch list of air sports categories / disciplines.
 */
export async function fetchCategories(): Promise<PublicCategoryItem[]> {
  try {
    const url = buildUrl('/categories');
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 60,
        tags: ['air-sports-categories'],
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
 * Fetch public tags.
 */
export async function fetchTags(): Promise<PublicTagItem[]> {
  try {
    const url = buildUrl('/tags');
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      next: {
        revalidate: 60,
        tags: ['air-sports-tags'],
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
      signal: apiTimeoutSignal(),
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
      signal: apiTimeoutSignal(),
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

/**
 * Submit email to air sports newsletter subscription.
 */
export async function subscribeNewsletter(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/sites/${SITE_KEY}/newsletter`, {
      signal: apiTimeoutSignal(),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return {
        success: false,
        message: err?.error?.message || 'Failed to subscribe. Please try again.',
      };
    }

    const payload = (await res.json()) as { data?: { message?: string } };
    return {
      success: true,
      message: payload.data?.message || 'Thank you for subscribing to Air Sports newsletter!',
    };
  } catch {
    return {
      success: false,
      message: 'Network error. Please try again later.',
    };
  }
}
