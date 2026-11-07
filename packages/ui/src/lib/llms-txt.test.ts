import { describe, expect, it } from 'vitest';

import { buildLlmsTxt } from './llms-txt';

describe('buildLlmsTxt', () => {
  it('produces the llmstxt.org shape: title, summary quote, link lists', () => {
    const text = buildLlmsTxt({
      name: 'Travel Blog',
      description: 'Independent travel writing.',
      sections: [{ title: 'Stories', url: 'https://x.test/articles', summary: 'All stories' }],
      articles: [{ title: 'Sundarbans by Boat', url: 'https://x.test/articles/s', summary: null }],
    });

    expect(text).toBe(
      [
        '# Travel Blog',
        '',
        '> Independent travel writing.',
        '',
        '## Sections',
        '- [Stories](https://x.test/articles): All stories',
        '',
        '## Latest articles',
        '- [Sundarbans by Boat](https://x.test/articles/s)',
        '',
      ].join('\n'),
    );
  });

  it('keeps hostile titles from breaking the Markdown link syntax', () => {
    const text = buildLlmsTxt({
      name: 'Site',
      description: 'd',
      sections: [],
      articles: [{ title: 'Evil](https://bad.test) [x\nnewline', url: 'https://x.test/a' }],
    });
    expect(text).toContain('- [Evil(https://bad.test) x newline](https://x.test/a)');
    expect(text.split('\n').filter((l) => l.startsWith('- ['))).toHaveLength(1);
  });

  it('truncates long summaries and omits empty sections', () => {
    const text = buildLlmsTxt({
      name: 'Site',
      description: 'd',
      sections: [],
      articles: [{ title: 'A', url: 'https://x.test/a', summary: 'x'.repeat(500) }],
    });
    expect(text).not.toContain('## Sections');
    const summary = text.split(': ')[1] ?? '';
    expect(summary.trim().length).toBe(200);
  });
});
