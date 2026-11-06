/**
 * Removes every `image` node whose `src` is one of `urls` from a Tiptap
 * document. Returns a new document (the input is not mutated) and how many
 * images were removed, so callers can skip writing when nothing changed.
 */
export function removeImageNodes(
  body: Record<string, unknown>,
  urls: ReadonlySet<string>,
): { body: Record<string, unknown>; removed: number } {
  let removed = 0;

  const visit = (node: unknown): unknown => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return node;
    const record = node as Record<string, unknown>;
    if (!Array.isArray(record.content)) return record;

    const content = record.content
      .filter((child) => {
        if (!child || typeof child !== 'object') return true;
        const { type, attrs } = child as { type?: unknown; attrs?: { src?: unknown } };
        const isTarget = type === 'image' && typeof attrs?.src === 'string' && urls.has(attrs.src);
        if (isTarget) removed += 1;
        return !isTarget;
      })
      .map(visit);
    return { ...record, content };
  };

  const next = visit(body) as Record<string, unknown>;
  return { body: removed > 0 ? next : body, removed };
}
