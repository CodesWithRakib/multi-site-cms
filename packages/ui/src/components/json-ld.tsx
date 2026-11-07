import { serializeJsonLd } from '../lib/json-ld';

export interface JsonLdProps {
  /** schema.org object or `@graph`; any CMS-derived string inside is escaped. */
  readonly data: unknown;
}

/** Structured data for crawlers. Server-renderable; always use this, never a raw `<script>`. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
