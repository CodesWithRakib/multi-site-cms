import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import {
  parseRevalidationPayload,
  REVALIDATE_SECRET_HEADER,
  verifyRevalidationSecret,
} from '@multi-site-cms/config/revalidation';

/** Site-wide tag attached to every content fetch in `src/lib/api.ts`. */
const SITE_CONTENT_TAG = 'travel-blog-content';

/**
 * On-demand ISR webhook. Contract: `POST`, header `x-revalidate-secret`, JSON
 * body `{ paths?: string[], tags?: string[] }`. See docs/publishing/cache-invalidation.md.
 */
export async function POST(request: NextRequest) {
  const auth = verifyRevalidationSecret(
    request.headers.get(REVALIDATE_SECRET_HEADER),
    process.env.REVALIDATE_SECRET,
  );
  if (auth === 'unconfigured') {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }
  if (auth === 'invalid') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = parseRevalidationPayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: 'Invalid revalidation payload' }, { status: 400 });
  }

  revalidateTag(SITE_CONTENT_TAG, 'default');
  for (const tag of payload.tags) {
    revalidateTag(tag, 'default');
  }
  for (const path of payload.paths) {
    revalidatePath(path);
  }
  revalidatePath('/');

  return NextResponse.json({
    revalidated: true,
    paths: payload.paths,
    tags: payload.tags,
    timestamp: new Date().toISOString(),
  });
}
