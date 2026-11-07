export interface LlmsLink {
  readonly title: string;
  /** Absolute URL. */
  readonly url: string;
  readonly summary?: string | null;
}

export interface LlmsTxtInput {
  readonly name: string;
  readonly description: string;
  readonly sections: readonly LlmsLink[];
  readonly articles: readonly LlmsLink[];
}

/** Markdown link text must not contain brackets or line breaks. */
function cleanTitle(value: string): string {
  return value.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
}

function cleanSummary(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function line(link: LlmsLink): string {
  const summary = cleanSummary(link.summary);
  return `- [${cleanTitle(link.title)}](${link.url})${summary ? `: ${summary}` : ''}`;
}

/**
 * `/llms.txt` per llmstxt.org: a short Markdown map of the site for language
 * models. It is built only from published public data (no drafts, no private
 * fields), so it can never expose more than the pages themselves do.
 */
export function buildLlmsTxt({ name, description, sections, articles }: LlmsTxtInput): string {
  const parts = [`# ${cleanTitle(name)}`, '', `> ${cleanSummary(description)}`];

  if (sections.length > 0) {
    parts.push('', '## Sections', ...sections.map(line));
  }
  if (articles.length > 0) {
    parts.push('', '## Latest articles', ...articles.map(line));
  }

  return `${parts.join('\n')}\n`;
}
