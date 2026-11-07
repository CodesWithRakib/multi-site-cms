// Built from code points so this source never contains the separators themselves.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g');
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g');
const BACKSLASH = String.fromCharCode(0x5c);

/**
 * Serializes structured data for an inline `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone is NOT safe there: a CMS title such as
 * `</script><script>alert(1)</script>` would close the tag and run. Escaping
 * `<` (and the two line separators that break JS string parsing in old
 * engines) keeps the payload valid JSON while making it inert in HTML.
 */
export function serializeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? 'null')
    .replace(/</g, `${BACKSLASH}u003c`)
    .replace(LINE_SEPARATOR, `${BACKSLASH}u2028`)
    .replace(PARAGRAPH_SEPARATOR, `${BACKSLASH}u2029`);
}

export interface BreadcrumbTrailItem {
  readonly name: string;
  /** Absolute URL of the page. */
  readonly url: string;
}

/** schema.org BreadcrumbList for the visible breadcrumb trail (first item first). */
export function breadcrumbJsonLd(items: readonly BreadcrumbTrailItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
