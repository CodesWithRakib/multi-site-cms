/**
 * Builders for Tiptap JSON documents, producing exactly the node and mark
 * shapes the admin editor (apps/admin/src/features/editor) writes, so the
 * demo content is indistinguishable from content typed in the UI.
 */

const markOf = (m) => (typeof m === 'string' ? { type: m } : m);

/** Inline text; plain strings inside other builders become text nodes. */
export function text(value, ...marks) {
  return marks.length > 0
    ? { type: 'text', text: value, marks: marks.map(markOf) }
    : { type: 'text', text: value };
}

const inline = (parts) => parts.map((part) => (typeof part === 'string' ? text(part) : part));

export const b = (value) => text(value, 'bold');
export const i = (value) => text(value, 'italic');
export const u = (value) => text(value, 'underline');
export const s = (value) => text(value, 'strike');
export const code = (value) => text(value, 'code');
export const link = (value, href) =>
  text(value, { type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } });
export const br = () => ({ type: 'hardBreak' });

export const p = (...parts) => ({ type: 'paragraph', content: inline(parts) });
export const center = (...parts) => ({
  type: 'paragraph',
  attrs: { textAlign: 'center' },
  content: inline(parts),
});
export const h2 = (value) => ({ type: 'heading', attrs: { level: 2 }, content: [text(value)] });
export const h3 = (value) => ({ type: 'heading', attrs: { level: 3 }, content: [text(value)] });

const listItem = (item) => ({
  type: 'listItem',
  content: [p(...(Array.isArray(item) ? item : [item]))],
});
export const ul = (...items) => ({ type: 'bulletList', content: items.map(listItem) });
export const ol = (...items) => ({ type: 'orderedList', content: items.map(listItem) });

export const quote = (...parts) => ({ type: 'blockquote', content: [p(...parts)] });
export const hr = () => ({ type: 'horizontalRule' });

/** Callout: 'info' | 'tip' | 'warning'. */
export const callout = (type, ...paragraphs) => ({
  type: 'calloutBlock',
  attrs: { type },
  content: paragraphs.map((para) => (Array.isArray(para) ? p(...para) : p(para))),
});

/** Inline image from an uploaded media asset; `title` is shown as the caption. */
export const image = (media, caption) => ({
  type: 'image',
  attrs: { src: media.url, alt: media.altText, title: caption ?? null },
});

export function table(header, rows) {
  const cell = (type) => (value) => ({
    type,
    content: [p(...(Array.isArray(value) ? value : [value]))],
  });
  return {
    type: 'table',
    content: [
      { type: 'tableRow', content: header.map(cell('tableHeader')) },
      ...rows.map((row) => ({ type: 'tableRow', content: row.map(cell('tableCell')) })),
    ],
  };
}

/** Travel destination fact card (editor: "Destination" button). */
export const destination = (attrs) => ({ type: 'destinationInfoBlock', attrs });

/** Live timeline entry (editor: timeline button on air-sports content). */
export const timeline = (attrs) => ({ type: 'eventTimelineBlock', attrs });

export const doc = (...content) => ({ type: 'doc', content });
