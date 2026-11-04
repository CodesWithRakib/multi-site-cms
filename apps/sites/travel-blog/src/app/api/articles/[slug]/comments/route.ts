import { type NextRequest, NextResponse } from 'next/server';
import type { CreatePublicCommentPayload } from '@multi-site-cms/types';
import { fetchArticleComments, submitArticleComment } from '@/lib/comments';
import { clientKeyFromHeaders, createRateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Limited here, not in the API: this handler proxies every reader's comment,
 * so the API only sees this server's address.
 */
const checkCommentRate = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const result = await fetchArticleComments(slug);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[Comments API Route] Error fetching comments:', error);
    return NextResponse.json({ items: [], total: 0, averageRating: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const rate = checkCommentRate(clientKeyFromHeaders(request.headers));
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many comments. Please wait a minute and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as CreatePublicCommentPayload;

    if (!body.authorName || !body.authorEmail || !body.content) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and comment content are required.' },
        { status: 400 },
      );
    }

    const result = await submitArticleComment(slug, body);
    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error('[Comments API Route] Error submitting comment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error submitting comment.' },
      { status: 500 },
    );
  }
}
