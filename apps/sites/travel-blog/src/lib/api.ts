import type {
  ApiSuccess,
  ListPublicPostsQuery,
  PaginatedResult,
  PublicArticleDetail,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicSiteConfig,
  PublicSitemapItem,
  PublicTagItem,
} from '@multi-site-cms/types';
import { siteConfig } from '@/config/site';

const API_BASE_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

const SITE_KEY = siteConfig.key;

/**
 * Standard fetch wrapper for public CMS API with Next.js ISR tags.
 */
async function fetchFromApi<T>(
  path: string,
  options: {
    revalidate?: number | false;
    tags?: string[];
    cache?: RequestCache;
  } = {},
): Promise<T | null> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: options.revalidate ?? 3600, // 1 hour default ISR
        tags: options.tags ?? ['travel-blog-content'],
      },
      cache: options.cache,
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.warn(`[CMS API] Failed GET ${url}: status ${res.status}`);
      return null;
    }

    const payload = (await res.json()) as ApiSuccess<T>;
    return payload.data;
  } catch (error) {
    console.error(`[CMS API] Network error connecting to ${url}:`, error);
    return null;
  }
}

/**
 * Fetch published articles for the Travel Blog with optional filters and pagination.
 */
export async function fetchArticles(
  query: ListPublicPostsQuery = {},
): Promise<PaginatedResult<PublicArticleSummary>> {
  const searchParams = new URLSearchParams();

  if (query.page) searchParams.set('page', String(query.page));
  if (query.limit) searchParams.set('limit', String(query.limit));
  if (query.type) searchParams.set('type', query.type);
  if (query.categorySlug) searchParams.set('categorySlug', query.categorySlug);
  if (query.tagSlug) searchParams.set('tagSlug', query.tagSlug);
  if (query.search) searchParams.set('search', query.search);
  if (query.featured) searchParams.set('featured', 'true');
  if (query.sort) searchParams.set('sort', query.sort);

  const queryString = searchParams.toString();
  const endpoint = `/public/sites/${SITE_KEY}/posts${queryString ? `?${queryString}` : ''}`;

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: {
        revalidate: 60, // revalidate every 60s
        tags: ['travel-blog-content', 'travel-blog-posts'],
      },
    });

    if (!res.ok) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 12,
        totalPages: 1,
      };
    }

    const payload = (await res.json()) as {
      data: PublicArticleSummary[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };

    return {
      items: payload.data ?? [],
      total: payload.pagination?.total ?? 0,
      page: payload.pagination?.page ?? 1,
      limit: payload.pagination?.limit ?? 12,
      totalPages: payload.pagination?.totalPages ?? 1,
    };
  } catch (error) {
    console.warn(`[CMS API] Failed to fetch articles from ${endpoint}:`, error);
    return {
      items: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      totalPages: 1,
    };
  }
}

/**
 * Fetch a single published article by its publication slug.
 */
export async function fetchArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  return fetchFromApi<PublicArticleDetail>(
    `/public/sites/${SITE_KEY}/posts/${encodeURIComponent(slug)}`,
    {
      revalidate: 60,
      tags: ['travel-blog-content', `travel-blog-article-${slug}`],
    },
  );
}

/**
 * Fetch active public categories with published post counts.
 */
export async function fetchCategories(): Promise<PublicCategoryItem[]> {
  const data = await fetchFromApi<PublicCategoryItem[]>(`/public/sites/${SITE_KEY}/categories`, {
    revalidate: 300,
    tags: ['travel-blog-content', 'travel-blog-categories'],
  });
  return data ?? [];
}

/**
 * Fetch active public tags with published post counts.
 */
export async function fetchTags(): Promise<PublicTagItem[]> {
  const data = await fetchFromApi<PublicTagItem[]>(`/public/sites/${SITE_KEY}/tags`, {
    revalidate: 300,
    tags: ['travel-blog-content', 'travel-blog-tags'],
  });
  return data ?? [];
}

/**
 * Fetch all publication slugs for dynamic XML sitemap generation.
 */
export async function fetchSitemap(): Promise<PublicSitemapItem[]> {
  const data = await fetchFromApi<PublicSitemapItem[]>(`/public/sites/${SITE_KEY}/sitemap`, {
    revalidate: 600,
    tags: ['travel-blog-content', 'travel-blog-sitemap'],
  });
  return data ?? [];
}

/**
 * Fetch authenticated draft post preview using signed preview token.
 */
export async function fetchDraftPreview(
  postId: string,
  token: string,
): Promise<PublicArticleDetail | null> {
  return fetchFromApi<PublicArticleDetail>(
    `/public/sites/${SITE_KEY}/preview/${postId}?token=${encodeURIComponent(token)}`,
    {
      cache: 'no-store',
      revalidate: 0,
    },
  );
}

/**
 * Fetch site configuration and branding from the CMS.
 */
export async function fetchSiteConfig(): Promise<PublicSiteConfig | null> {
  return fetchFromApi<PublicSiteConfig>(`/public/sites/${SITE_KEY}/config`, {
    revalidate: 300,
    tags: ['travel-blog-config'],
  });
}

/**
 * Submit email to public site newsletter subscription.
 */
export async function subscribeNewsletter(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/sites/${SITE_KEY}/newsletter`, {
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
      message: payload.data?.message || 'Thank you for subscribing to our travel newsletter!',
    };
  } catch {
    return {
      success: false,
      message: 'Network error. Please try again later.',
    };
  }
}

export type {
  PublicArticleDetail,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicSiteConfig,
  PublicTagItem,
} from '@multi-site-cms/types';

export type PublicArticle = PublicArticleSummary;
export type PublicCategory = PublicCategoryItem;
