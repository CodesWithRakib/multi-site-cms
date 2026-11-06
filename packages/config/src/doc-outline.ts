/**
 * Table of contents for a Tiptap document. Public sites render heading `id`s
 * with `headingId`, so links built from `documentOutline` always land on the
 * matching heading.
 */

interface OutlineNode {
  readonly type?: string;
  readonly text?: string;
  readonly attrs?: Record<string, unknown>;
  readonly content?: readonly OutlineNode[];
}

export interface OutlineEntry {
  readonly id: string;
  readonly text: string;
  readonly level: number;
}

/** Anchor id for a heading's text: "Where to go?" → "where-to-go". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nodeText(node: OutlineNode): string {
  if (typeof node.text === 'string') return node.text;
  return node.content?.map(nodeText).join('') ?? '';
}

/**
 * Top-level headings of the given levels, in document order. Headings without
 * text, and repeats of an id already listed, are skipped.
 */
export function documentOutline(body: unknown, levels: readonly number[] = [2, 3]): OutlineEntry[] {
  const root = body as OutlineNode | null;
  if (!root || !Array.isArray(root.content)) return [];

  const seen = new Set<string>();
  const entries: OutlineEntry[] = [];
  for (const node of root.content) {
    if (node.type !== 'heading') continue;
    const level = Number(node.attrs?.level) || 2;
    if (!levels.includes(level)) continue;
    const text = nodeText(node).trim();
    const id = headingId(text);
    if (!text || !id || seen.has(id)) continue;
    seen.add(id);
    entries.push({ id, text, level });
  }
  return entries;
}
