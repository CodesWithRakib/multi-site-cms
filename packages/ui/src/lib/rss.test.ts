import { describe, expect, it } from 'vitest';

import { buildRssFeed, escapeXml } from './rss';

const base = {
  title: 'Travel Blog',
  link: 'https://x.test',
  feedUrl: 'https://x.test/feed.xml',
  description: 'Stories',
};

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`Tom & "Jerry" <b> 'x'`)).toBe(
      'Tom &amp; &quot;Jerry&quot; &lt;b&gt; &apos;x&apos;',
    );
  });

  it('drops control characters XML 1.0 cannot carry but keeps tab, newline and emoji', () => {
    const bell = String.fromCharCode(0x07);
    const nul = String.fromCharCode(0x00);
    expect(escapeXml(`a${bell}b${nul}c\td\ne 🌍`)).toBe('abc\td\ne 🌍');
  });
});

describe('buildRssFeed', () => {
  it('produces an RSS 2.0 document with a self link and permalink GUIDs', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        {
          title: 'Sundarbans by Boat',
          link: 'https://x.test/articles/s',
          publishedAt: '2026-11-06T09:27:00.000Z',
          description: 'Tigers and tides.',
          categories: ['Destinations', 'Nature'],
        },
      ],
    });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<atom:link href="https://x.test/feed.xml" rel="self"');
    expect(xml).toContain('<guid isPermaLink="true">https://x.test/articles/s</guid>');
    expect(xml).toContain('<pubDate>Fri, 06 Nov 2026 09:27:00 GMT</pubDate>');
    expect(xml).toContain('<lastBuildDate>Fri, 06 Nov 2026 09:27:00 GMT</lastBuildDate>');
    expect(xml).toContain('<category>Destinations</category>');
  });

  it('cannot be broken or injected into by hostile CMS text', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        {
          title: ']]></title><script>alert(1)</script>',
          link: 'https://x.test/a?x=1&y=2',
          publishedAt: '2026-11-06T09:27:00.000Z',
          description: '<![CDATA[ evil ]]>',
        },
      ],
    });

    expect(xml).not.toContain('<script>');
    expect(xml).not.toContain('<![CDATA[');
    expect(xml).toContain('https://x.test/a?x=1&amp;y=2');
    // Exactly one item element opened and closed.
    expect(xml.match(/<item>/g)).toHaveLength(1);
    expect(xml.match(/<\/item>/g)).toHaveLength(1);
  });

  it('omits pubDate for an invalid date and skips empty descriptions', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        { title: 'A', link: 'https://x.test/a', publishedAt: 'not-a-date', description: '  ' },
      ],
    });
    expect(xml).not.toContain('<pubDate>');
    expect(xml).not.toContain('<lastBuildDate>');
    expect(xml).not.toContain('<description>  ');
  });

  it('is still a valid empty channel with no items', () => {
    const xml = buildRssFeed({ ...base, items: [] });
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });
});
