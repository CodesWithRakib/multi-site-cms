import type { PublicSiteConfig, SiteAbout, SiteAboutPillar } from '@multi-site-cms/types';

/** Limits enforced by the API (class-validator) and mirrored by the admin form. */
export const SITE_ABOUT_LIMITS = {
  eyebrow: 60,
  headline: 120,
  highlight: 60,
  intro: 2000,
  pillarTitle: 60,
  pillarBody: 400,
  maxPillars: 6,
} as const;

export const EMPTY_SITE_ABOUT: SiteAbout = {
  eyebrow: '',
  headline: '',
  highlight: '',
  intro: '',
  pillars: [],
  showWriters: true,
};

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '';
}

/**
 * Turns whatever is stored (possibly partial or from an older version) into a
 * complete, trimmed, size-bounded About record. A pillar needs a title; blank
 * ones are dropped, and no more than `maxPillars` are kept.
 */
export function normalizeSiteAbout(input: Partial<SiteAbout> | null | undefined): SiteAbout {
  const source = input ?? {};
  const pillars: SiteAboutPillar[] = Array.isArray(source.pillars)
    ? source.pillars
        .map((pillar) => ({
          title: clean(pillar?.title, SITE_ABOUT_LIMITS.pillarTitle),
          body: clean(pillar?.body, SITE_ABOUT_LIMITS.pillarBody),
        }))
        .filter((pillar) => pillar.title.length > 0)
        .slice(0, SITE_ABOUT_LIMITS.maxPillars)
    : [];

  return {
    eyebrow: clean(source.eyebrow, SITE_ABOUT_LIMITS.eyebrow),
    headline: clean(source.headline, SITE_ABOUT_LIMITS.headline),
    highlight: clean(source.highlight, SITE_ABOUT_LIMITS.highlight),
    intro: clean(source.intro, SITE_ABOUT_LIMITS.intro),
    pillars,
    showWriters: source.showWriters !== false,
  };
}

/** True once the owner has written something worth showing instead of the defaults. */
export function hasSiteAboutContent(about: SiteAbout | null | undefined): about is SiteAbout {
  return Boolean(about && (about.headline || about.intro || about.pillars.length > 0));
}

/** Splits the intro into paragraphs on blank lines. */
export function aboutParagraphs(intro: string): string[] {
  return intro
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0);
}

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

/**
 * What a public About page shows. The owner's text wins; whatever they left
 * blank falls back to neutral values built from the site's own name and
 * description, so the page is never empty and never claims anything the owner
 * did not write.
 */
export function resolveAboutContent(
  config: PublicSiteConfig | null,
  fallback: { readonly name: string; readonly description: string },
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
