import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * On-demand ISR revalidation webhook handler for Air Sports.
 * Triggered by the Phase 08 Outbox dispatcher on publication events.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized revalidation' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      tag?: string;
      slug?: string;
    };

    // Global tag purge for Air Sports
    revalidateTag('air-sports-content', 'default');

    if (body.slug) {
      revalidateTag(`air-sports-post-${body.slug}`, 'default');
      revalidateTag(`air-sports-event-${body.slug}`, 'default');
    }

    if (body.tag) {
      revalidateTag(body.tag, 'default');
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      purgedTags: ['air-sports-content', body.slug ? `air-sports-post-${body.slug}` : null].filter(
        Boolean,
      ),
    });
  } catch (err) {
    console.warn('[Air Sports Revalidate] Revalidation error:', err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
