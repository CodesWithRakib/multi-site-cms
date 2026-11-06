import { describe, expect, it } from '@jest/globals';

import { removeImageNodes } from '../../src/posts/utils/body-media';

const image = (src: string) => ({ type: 'image', attrs: { src, alt: '' } });
const para = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('removeImageNodes', () => {
  const gone = new Set(['https://cdn.test/gone.jpg', '/api/v1/media/assets/gone.jpg']);

  it('removes matching images at any depth and counts them', () => {
    const body = {
      type: 'doc',
      content: [
        para('Intro'),
        image('https://cdn.test/gone.jpg'),
        image('https://cdn.test/keep.jpg'),
        { type: 'calloutBlock', content: [image('/api/v1/media/assets/gone.jpg'), para('Tip')] },
      ],
    };

    const result = removeImageNodes(body, gone);

    expect(result.removed).toBe(2);
    expect(result.body).toEqual({
      type: 'doc',
      content: [
        para('Intro'),
        image('https://cdn.test/keep.jpg'),
        { type: 'calloutBlock', content: [para('Tip')] },
      ],
    });
  });

  it('returns the original object untouched when nothing matches', () => {
    const body = { type: 'doc', content: [para('Only text'), image('https://cdn.test/keep.jpg')] };
    const result = removeImageNodes(body, gone);
    expect(result.removed).toBe(0);
    expect(result.body).toBe(body);
  });
});
