import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { PublicCategoryItem } from '@multi-site-cms/types';

import { PopularAirSports } from './PopularAirSports';

function category(slug: string, postCount: number, name = slug): PublicCategoryItem {
  return { id: slug, slug, name, description: `${name} coverage`, parentId: null, postCount };
}

describe('PopularAirSports', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the most-covered categories first, at most four, skipping empty ones', () => {
    render(
      <PopularAirSports
        categories={[
          category('skydiving', 2, 'Skydiving'),
          category('empty', 0, 'Empty'),
          category('paragliding', 9, 'Paragliding'),
          category('wingsuit', 1, 'Wingsuit'),
          category('ballooning', 5, 'Ballooning'),
          category('gliding', 1, 'Gliding'),
        ]}
      />,
    );

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Paragliding', 'Ballooning', 'Skydiving', 'Gliding']);
    expect(screen.queryByText('Empty')).toBeNull();
    expect(screen.getByText('9 dispatches')).toBeTruthy();
    expect(screen.getAllByText('1 dispatch')).toHaveLength(1);
  });

  it('never shows invented ratings or review counts', () => {
    const { container } = render(<PopularAirSports categories={[category('skydiving', 3)]} />);

    expect(container.textContent).not.toMatch(/review|rating|★/i);
  });

  it('renders nothing when no category has published coverage', () => {
    const { container } = render(<PopularAirSports categories={[category('empty', 0)]} />);

    expect(container.innerHTML).toBe('');
  });
});
