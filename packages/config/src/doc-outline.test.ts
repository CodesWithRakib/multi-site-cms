import { describe, expect, it } from 'vitest';

import { documentOutline, headingId } from './doc-outline';

const heading = (level: number, ...parts: string[]) => ({
  type: 'heading',
  attrs: { level },
  content: parts.map((text, i) => ({ type: 'text', text, marks: i ? [{ type: 'bold' }] : [] })),
});

describe('headingId', () => {
  it('builds URL-safe anchors', () => {
    expect(headingId('  Cox’s Bazar: When to Go?  ')).toBe('coxs-bazar-when-to-go');
    expect(headingId('Kites & string')).toBe('kites-string');
  });
});

describe('documentOutline', () => {
  it('lists h2/h3 headings in order, joining marked text', () => {
    const body = {
      type: 'doc',
      content: [
        heading(1, 'Title'),
        { type: 'paragraph', content: [{ type: 'text', text: 'Intro' }] },
        heading(2, 'How a ', 'trip', ' works'),
        heading(3, 'Packing'),
        heading(4, 'Too deep'),
      ],
    };
    expect(documentOutline(body)).toEqual([
      { id: 'how-a-trip-works', text: 'How a trip works', level: 2 },
      { id: 'packing', text: 'Packing', level: 3 },
    ]);
  });

  it('skips empty and duplicate headings and tolerates bad input', () => {
    const body = { content: [heading(2, ' '), heading(2, 'Tips'), heading(2, 'Tips')] };
    expect(documentOutline(body)).toEqual([{ id: 'tips', text: 'Tips', level: 2 }]);
    expect(documentOutline(null)).toEqual([]);
    expect(documentOutline({ type: 'doc' })).toEqual([]);
  });
});
