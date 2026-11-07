export interface RssItem {
  readonly title: string;
  /** Absolute URL of the article; also used as the permanent GUID. */
  readonly link: string;
  /** ISO date string. */
  readonly publishedAt: string;
  readonly description?: string | null;
  readonly categories?: readonly string[];
}

export interface RssFeedInput {
  readonly title: string;
  /** Absolute URL of the site. */
  readonly link: string;
  /** Absolute URL of this feed. */
  readonly feedUrl: string;
  readonly description: string;
  readonly language?: string;
  readonly items: readonly RssItem[];
}

/** XML 1.0 forbids most control characters; one in a CMS title would break every reader. */
function isValidXmlChar(code: number): boolean {
  return code === 0x09 || code === 0x0a || code === 0x0d || code >= 0x20;
}

/** Escapes text for element content and attributes, dropping characters XML cannot carry. */
export function escapeXml(value: string): string {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (!isValidXmlChar(code)) continue;
    switch (char) {
      case '&':
        out += '&amp;';
        break;
      case '<':
        out += '&lt;';
        break;
      case '>':
        out += '&gt;';
        break;
      case '"':
        out += '&quot;';
        break;
      case "'":
        out += '&apos;';
        break;
      default:
        out += char;
    }
  }
  return out;
}

function rfc822(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

function itemXml(item: RssItem): string {
  const pubDate = rfc822(item.publishedAt);
  const lines = [
    '    <item>',
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(item.link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
  ];
  if (pubDate) lines.push(`      <pubDate>${pubDate}</pubDate>`);
  if (item.description?.trim()) {
    lines.push(`      <description>${escapeXml(item.description.trim())}</description>`);
  }
  for (const category of item.categories ?? []) {
    lines.push(`      <category>${escapeXml(category)}</category>`);
  }
  lines.push('    </item>');
  return lines.join('\n');
}

/**
 * RSS 2.0 feed of published articles. Every CMS-supplied string is escaped, and
 * items with an unparseable date simply omit `pubDate` instead of failing the feed.
 */
export function buildRssFeed(input: RssFeedInput): string {
  const newest = input.items
    .map((item) => rfc822(item.publishedAt))
    .find((value): value is string => value !== null);

  const channel = [
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(input.link)}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    `    <language>${escapeXml(input.language ?? 'en')}</language>`,
    `    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml" />`,
  ];
  if (newest) channel.push(`    <lastBuildDate>${newest}</lastBuildDate>`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    ...channel,
    ...input.items.map(itemXml),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
