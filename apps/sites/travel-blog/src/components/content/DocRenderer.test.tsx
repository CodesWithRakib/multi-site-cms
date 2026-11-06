import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import { DocRenderer } from './DocRenderer';

describe('DocRenderer (Structured AST Mapper & Security Sanitizer)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders null when document is empty or undefined', () => {
    const { container } = render(<DocRenderer document={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders paragraphs, headings with slugified anchor ids, and text formatting', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Northern Fjord Exploration' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
            { type: 'text', text: ' and ' },
            { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
            { type: 'text', text: '.' },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeDefined();
    expect(heading.id).toBe('northern-fjord-exploration');
    expect(screen.getByText('bold text').tagName).toBe('STRONG');
    expect(screen.getByText('italic text').tagName).toBe('EM');
  });

  it('renders blockquote and lists correctly', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [{ type: 'text', text: 'Travel is fatal to prejudice.' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: 'Pack warm thermal layers' }],
            },
            {
              type: 'listItem',
              content: [{ type: 'text', text: 'Carry local currency' }],
            },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    expect(screen.getByText('Travel is fatal to prejudice.')).toBeDefined();
    expect(screen.getByText('Pack warm thermal layers')).toBeDefined();
    expect(screen.getByText('Carry local currency')).toBeDefined();
  });

  it('renders rich destinationInfoBlock card', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'destinationInfoBlock',
          attrs: {
            destination: 'Lofoten Islands',
            country: 'Norway',
            region: 'Nordland',
            bestTimeToVisit: 'May to August',
            currency: 'NOK',
            language: 'Norwegian',
            highlights: ['Midnight Sun', 'Rorbu cabins', 'Reinebringen hike'],
          },
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    expect(screen.getByText('Lofoten Islands')).toBeDefined();
    expect(screen.getByText('Nordland, Norway')).toBeDefined();
    expect(screen.getByText('May to August')).toBeDefined();
    expect(screen.getByText('NOK')).toBeDefined();
    expect(screen.getByText('Midnight Sun')).toBeDefined();
    expect(screen.getByText('Reinebringen hike')).toBeDefined();
  });

  it('sanitizes dangerous javascript: links and drops them safely', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(document.cookie)' } }],
              text: 'Dangerous Link',
            },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://example.com/safe-guide' } }],
              text: 'Safe Link',
            },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    // Dangerous link must NOT be an <a> tag with javascript scheme
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(1);
    expect(links[0]?.getAttribute('href')).toBe('https://example.com/safe-guide');
    // Dangerous text still renders as safe text without a link
    expect(screen.getByText('Dangerous Link')).toBeDefined();
  });

  it('handles unknown or unexpected node types gracefully without throwing', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'someUnknownCustomPluginNode',
          attrs: { foo: 'bar' },
          content: [{ type: 'text', text: 'Graceful fallback text' }],
        },
      ],
    };

    expect(() => render(<DocRenderer document={doc} />)).not.toThrow();
    expect(screen.getByText('Graceful fallback text')).toBeDefined();
  });
  it('embeds YouTube links via the nocookie player and never iframes other hosts', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'youtube', attrs: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
        { type: 'youtube', attrs: { src: 'https://evil.example/embed/dQw4w9WgXcQ' } },
      ],
    };
    const { container } = render(<DocRenderer document={doc} />);
    const frames = container.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0]?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it('keeps Shift+Enter line breaks, underline and text alignment from the editor', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [
            { type: 'text', text: 'First line' },
            { type: 'hardBreak' },
            { type: 'text', marks: [{ type: 'underline' }], text: 'Second line' },
          ],
        },
      ],
    };
    const { container } = render(<DocRenderer document={doc} />);
    const paragraph = container.querySelector('p');
    expect(paragraph?.querySelector('br')).not.toBeNull();
    expect(paragraph?.querySelector('u')?.textContent).toBe('Second line');
    expect(paragraph?.style.textAlign).toBe('center');
  });
  it('wraps table rows in a tbody so server and client HTML match', () => {
    const cell = (type: string, text: string) => ({
      type,
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            { type: 'tableRow', content: [cell('tableHeader', 'Stop')] },
            { type: 'tableRow', content: [cell('tableCell', 'Vik')] },
          ],
        },
      ],
    };
    const { container } = render(<DocRenderer document={doc} />);
    expect(container.querySelectorAll('table > tbody > tr')).toHaveLength(2);
    expect(container.querySelector('table > tr')).toBeNull();
  });
});
