import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { parseBrowseParams } from '../lib/browse';
import { BrowseSearchForm, BrowseSortTabs, BrowseTopicChips } from './browse-controls';

function Link({ href, children, ...rest }: { href: string; children: ReactNode }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

const topics = [
  { id: '1', name: 'Nature', slug: 'nature', postCount: 4 },
  { id: '2', name: 'Culture', slug: 'culture', postCount: 9 },
  { id: '3', name: 'Empty', slug: 'empty', postCount: 0 },
];

describe('BrowseTopicChips', () => {
  const state = parseBrowseParams({ q: 'tea', sort: 'oldest' });

  it('lists All plus busiest topics first, hides empty ones, and shows no counts', () => {
    render(<BrowseTopicChips topics={topics} state={state} linkComponent={Link} label="Topic" />);
    const nav = screen.getByRole('navigation', { name: 'Topic' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['All', 'Culture', 'Nature']);
    expect(nav.textContent).not.toMatch(/\d/);
  });

  it('keeps the search text and sort when a topic is chosen', () => {
    render(<BrowseTopicChips topics={topics} state={state} linkComponent={Link} label="Topic" />);
    expect(screen.getByRole('link', { name: 'Nature' }).getAttribute('href')).toBe(
      '/articles?q=tea&category=nature&sort=oldest',
    );
  });

  it('marks the active topic and offers to remove an active tag', () => {
    const active = parseBrowseParams({ category: 'nature', tag: 'tea' });
    render(<BrowseTopicChips topics={topics} state={active} linkComponent={Link} label="Topic" />);
    expect(screen.getByRole('link', { name: 'Nature' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('link', { name: 'Remove tag filter: tea' }).getAttribute('href')).toBe(
      '/articles?category=nature',
    );
  });
});

describe('BrowseSortTabs', () => {
  it('links every order and marks the current one', () => {
    render(<BrowseSortTabs state={parseBrowseParams({ sort: 'popular' })} linkComponent={Link} />);
    expect(screen.getByRole('link', { name: 'Popular' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('link', { name: 'A–Z' }).getAttribute('href')).toBe(
      '/articles?sort=title_asc',
    );
  });
});

describe('BrowseSearchForm', () => {
  it('is a GET search form that carries the filters as hidden fields', () => {
    const { container } = render(
      <BrowseSearchForm
        state={parseBrowseParams({ q: 'kite', category: 'nature', sort: 'oldest' })}
      />,
    );
    const form = container.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/articles');
    expect(form?.getAttribute('id')).toBe('search');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('kite');
    const hidden = [...container.querySelectorAll('input[type=hidden]')].map(
      (i) => `${i.getAttribute('name')}=${i.getAttribute('value')}`,
    );
    expect(hidden).toEqual(['category=nature', 'sort=oldest']);
  });
});
