import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipLink } from './skip-link';

describe('SkipLink', () => {
  it('links to the main content and is hidden until focused', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link.getAttribute('href')).toBe('#main-content');
    expect(link.className).toContain('sr-only');
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('accepts a custom target and label', () => {
    render(<SkipLink targetId="editor" label="Skip to editor" />);

    expect(screen.getByRole('link', { name: 'Skip to editor' }).getAttribute('href')).toBe(
      '#editor',
    );
  });
});
