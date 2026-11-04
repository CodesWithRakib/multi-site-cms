import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusPage } from './status-page';

describe('StatusPage', () => {
  it('renders the code, a single h1 title, description, and actions', () => {
    render(
      <StatusPage
        code="404"
        title="Page not found"
        description="The page may have moved."
        actions={<a href="/">Back to home</a>}
      />,
    );

    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    expect(screen.getByText('The page may have moved.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
  });

  it('omits the code and action row when not provided', () => {
    const { container } = render(<StatusPage title="Something went wrong" description="Retry." />);

    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelector('div')).toBeNull();
  });
});
