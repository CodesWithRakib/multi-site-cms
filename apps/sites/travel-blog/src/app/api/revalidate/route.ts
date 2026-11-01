import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

async function handleRevalidation(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-revalidate-secret');

  const expectedSecret =
    process.env.REVALIDATE_SECRET ||
    process.env.SESSION_SECRET ||
    'revalidate-secret-key-multi-site-cms-2026';

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid or missing revalidation secret' }, { status: 401 });
  }

  const slug = searchParams.get('slug');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  // Revalidate tags if specified, or global travel-blog-content tag by default
  if (tag) {
    revalidateTag(tag, 'default');
  } else {
    revalidateTag('travel-blog-content', 'default');
  }

  // Revalidate specific path or article slug
  if (slug) {
    revalidatePath(`/articles/${slug}`);
  }
  if (path) {
    revalidatePath(path);
  }

  // Always refresh front page
  revalidatePath('/');

  return NextResponse.json({
    revalidated: true,
    slug: slug || null,
    path: path || null,
    timestamp: new Date().toISOString(),
  });
}
