import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { DocRenderer } from './DocRenderer';

describe('DocRenderer (Air Sports)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders standard paragraphs and headings with generated anchor IDs', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Supersonic Glide Ratio' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Measuring glide ratios at ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Mach 0.85' },
            { type: 'text', text: ' above Mont Blanc.' },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    const heading = screen.getByRole('heading', { level: 2, name: /Supersonic Glide Ratio/i });
    expect(heading).toBeDefined();
    expect(heading.id).toBe('supersonic-glide-ratio');

    expect(screen.getByText(/Measuring glide ratios at/i)).toBeDefined();
    expect(screen.getByText('Mach 0.85')).toBeDefined();
  });

  it('renders custom eventTimelineBlock with telemetric metrics', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'eventTimelineBlock',
          attrs: {
            time: '14:30',
            title: 'Round 2 Heat Launch',
            description: 'Lead pack crossing turnpoint 3 over the ridge.',
            status: 'live',
            windSpeed: '24 kts WNW',
            weatherCondition: 'Scattered Cirrus',
            alertLevel: 'advisory',
          },
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    expect(screen.getByText('14:30')).toBeDefined();
    expect(screen.getByText('Round 2 Heat Launch')).toBeDefined();
    expect(screen.getByText('live')).toBeDefined();
    expect(screen.getByText(/24 kts WNW/i)).toBeDefined();
    expect(screen.getByText(/Scattered Cirrus/i)).toBeDefined();
    expect(screen.getByText(/Alert: advisory/i)).toBeDefined();
  });

  it('strips dangerous javascript: and data: URI schemes from links', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert("xss")' } }],
              text: 'Malicious Link',
            },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://airsports.org/live' } }],
              text: 'Safe Radar Link',
            },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    const links = screen.getAllByRole('link');
    const malicious = links.find((l) => l.textContent === 'Malicious Link');
    expect(malicious?.getAttribute('href')).toBe('#');

    const safe = links.find((l) => l.textContent === 'Safe Radar Link');
    expect(safe?.getAttribute('href')).toBe('https://airsports.org/live');
    expect(safe?.getAttribute('target')).toBe('_blank');
    expect(safe?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders callout blocks with appropriate alert styling', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { type: 'warning' },
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Thermal turbulence advisory in effect above 3000m MSL.' },
              ],
            },
          ],
        },
      ],
    };

    render(<DocRenderer document={doc} />);

    expect(screen.getByText(/Thermal turbulence advisory in effect/i)).toBeDefined();
  });

  it('fails safely and does not throw for unknown or experimental AST nodes', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'unsupportedFutureExtension',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested child text.' }] }],
        },
      ],
    };

    expect(() => render(<DocRenderer document={doc} />)).not.toThrow();
    expect(screen.getByText('Nested child text.')).toBeDefined();
  });

  it('returns null gracefully for empty or null document', () => {
    const { container } = render(<DocRenderer document={null} />);
    expect(container.firstChild).toBeNull();
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
