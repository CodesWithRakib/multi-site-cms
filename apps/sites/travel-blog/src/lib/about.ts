import type { PublicSiteConfig, SiteAboutPillar } from '@multi-site-cms/types';
import { aboutParagraphs, hasSiteAboutContent } from '@multi-site-cms/validation/site-about';

export interface AboutContent {
  readonly eyebrow: string;
  readonly headline: string;
  readonly highlight: string;
  readonly paragraphs: readonly string[];
  readonly pillars: readonly SiteAboutPillar[];
  readonly showWriters: boolean;
  /** Plain-text summary for `<meta name="description">`. */
  readonly summary: string;
}

interface AboutFallback {
  readonly name: string;
  readonly description: string;
}

/**
 * What the About page shows. The owner's text wins; whatever they left blank
 * falls back to neutral values built from the site's own name and description,
 * so the page is never empty and never claims anything the owner did not write.
 */
export function resolveAboutContent(
  config: PublicSiteConfig | null,
  fallback: AboutFallback,
): AboutContent {
  const siteName = config?.branding.displayName || fallback.name;
  const siteDescription = config?.branding.description || fallback.description;
  const about = hasSiteAboutContent(config?.about) ? config.about : null;

  const paragraphs = about ? aboutParagraphs(about.intro) : [];
  const resolvedParagraphs = paragraphs.length > 0 ? paragraphs : [siteDescription];

  return {
    eyebrow: about?.eyebrow || 'About',
    headline: about?.headline || `About ${siteName}`,
    highlight: about?.highlight ?? '',
    paragraphs: resolvedParagraphs,
    pillars: about?.pillars ?? [],
    showWriters: about?.showWriters ?? true,
    summary: (resolvedParagraphs[0] ?? siteDescription).slice(0, 200),
  };
}
