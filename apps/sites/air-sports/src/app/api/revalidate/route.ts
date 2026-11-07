import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import {
  parseRevalidationPayload,
  REVALIDATE_SECRET_HEADER,
  verifyRevalidationSecret,
} from '@multi-site-cms/config/revalidation';

/** Site-level tags attached to the content fetches in `src/lib/api.ts`. */
const SITE_TAGS = [
  'air-sports-content',
  'air-sports-events',
  'air-sports-categories',
  'air-sports-tags',
  'air-sports-config',
] as const;

/**
 * On-demand ISR webhook. Contract: `POST`, header `x-revalidate-secret`, JSON
 * body `{ paths?: string[], tags?: string[] }`. See docs/publishing/cache-invalidation.md.
 */
export async function POST(req: NextRequest) {
  const auth = verifyRevalidationSecret(
    req.headers.get(REVALIDATE_SECRET_HEADER),
    process.env.REVALIDATE_SECRET,
  );
  if (auth === 'unconfigured') {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }
  if (auth === 'invalid') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = parseRevalidationPayload(await req.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: 'Invalid revalidation payload' }, { status: 400 });
  }

  for (const tag of [...SITE_TAGS, ...payload.tags]) {
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
