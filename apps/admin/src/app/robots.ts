import type { MetadataRoute } from 'next';

/** The admin is private: no crawling at all (pages also send `noindex, nofollow`). */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}
