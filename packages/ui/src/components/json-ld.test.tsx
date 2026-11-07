import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { breadcrumbJsonLd, serializeJsonLd } from '../lib/json-ld';
import { JsonLd } from './json-ld';

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

describe('serializeJsonLd', () => {
  it('stays valid JSON that round-trips to the original data', () => {
    const data = {
      '@type': 'Article',
      headline: 'Tigers & "boats" <b>',
      n: 3,
      nested: { ok: true },
    };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it('escapes < so a title cannot close the script tag (stored-XSS regression)', () => {
    const hostile = '</script><script>alert(1)</script>';
    const out = serializeJsonLd({ headline: hostile });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).headline).toBe(hostile);
  });

  it('escapes the JS line separators U+2028 / U+2029', () => {
    const value = `x${LINE_SEPARATOR}y${PARAGRAPH_SEPARATOR}z`;
    const out = serializeJsonLd({ a: value });
    expect(out).not.toContain(LINE_SEPARATOR);
    expect(out).not.toContain(PARAGRAPH_SEPARATOR);
    expect(JSON.parse(out).a).toBe(value);
  });

  it('serializes undefined as null instead of throwing', () => {
    expect(serializeJsonLd(undefined)).toBe('null');
  });
});

describe('JsonLd component', () => {
  it('renders one script element whose content cannot break out', () => {
    const html = renderToStaticMarkup(<JsonLd data={{ headline: '</script><img onerror=x>' }} />);
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
    // Exactly one closing tag: the real one.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain('<img');
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers the trail from 1 with absolute item URLs', () => {
    const data = breadcrumbJsonLd([
      { name: 'Home', url: 'https://example.com/' },
      { name: 'Stories', url: 'https://example.com/articles' },
    ]) as { itemListElement: Array<{ position: number; name: string; item: string }> };

    expect(data.itemListElement.map((e) => [e.position, e.name, e.item])).toEqual([
      [1, 'Home', 'https://example.com/'],
      [2, 'Stories', 'https://example.com/articles'],
    ]);
  });
});
