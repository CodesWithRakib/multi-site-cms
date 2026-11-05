import type {
  CreatePublicCommentPayload,
  PublicCommentsResult,
  SubmittedPublicComment,
} from '@multi-site-cms/types';
import { siteConfig } from '@/config/site';
import { apiTimeoutSignal } from './api-timeout';

const API_BASE_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

const SITE_KEY = siteConfig.key;

/**
 * Fetch approved comments for a specific article.
 */
export async function fetchArticleComments(slug: string): Promise<PublicCommentsResult> {
  const url = `${API_BASE_URL}/public/sites/${SITE_KEY}/posts/${encodeURIComponent(slug)}/comments`;

  try {
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 30, tags: [`comments-${slug}`] },
    });

    if (!res.ok) {
      return { items: [], total: 0, averageRating: null };
    }

    const payload = (await res.json()) as { data: PublicCommentsResult };
    return payload.data ?? { items: [], total: 0, averageRating: null };
  } catch {
    return { items: [], total: 0, averageRating: null };
  }
}

/**
 * Submit a reader comment with optional rating and honeypot spam protection.
 */
export async function submitArticleComment(
  slug: string,
  payload: CreatePublicCommentPayload,
): Promise<{ success: boolean; data?: SubmittedPublicComment; message?: string }> {
  const url = `${API_BASE_URL}/public/sites/${SITE_KEY}/posts/${encodeURIComponent(slug)}/comments`;

  try {
    const res = await fetch(url, {
      signal: apiTimeoutSignal(),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return {
        success: false,
        message: err?.error?.message || 'Failed to submit comment. Please check your inputs.',
      };
    }

    const json = (await res.json()) as { data: SubmittedPublicComment };
    return {
      success: true,
      data: json.data,
      message:
        json.data.status === 'approved'
          ? 'Thank you! Your reflection has been posted.'
          : 'Thank you! Your reflection will appear after review.',
    };
  } catch {
    return {
      success: false,
      message: 'Unable to connect to service. Please try again later.',
    };
  }
}
