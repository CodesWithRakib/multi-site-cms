import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renders a native button with the default variant', () => {
    render(<Button>Check again</Button>);

    const button = screen.getByRole('button', { name: 'Check again' });
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.className).toContain('bg-primary');
  });

  it('composes with a link when asChild is enabled', () => {
    render(
      <Button asChild variant="outline">
        <a href="/documentation">Documentation</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link.getAttribute('href')).toBe('/documentation');
    expect(link.className).toContain('border-border');
  });
});
