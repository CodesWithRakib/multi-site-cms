import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getPageWindow } from '../lib/page-window';
import { PaginationLinks, type PaginationLinkProps } from './pagination-links';

function TestLink({ href, className, children, ...rest }: PaginationLinkProps) {
  return (
    <a
      href={href}
      className={className}
      aria-label={rest['aria-label']}
      aria-current={rest['aria-current']}
      rel={rest.rel}
    >
      {children}
    </a>
  );
}

const hrefFor = (page: number) => (page === 1 ? '/articles' : `/articles?page=${page}`);

describe('getPageWindow', () => {
  it('shows every page when there are few', () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses distant pages into ellipses around the current page', () => {
    expect(getPageWindow(1, 20)).toEqual([1, 2, 'ellipsis-end', 20]);
    expect(getPageWindow(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
    expect(getPageWindow(20, 20)).toEqual([1, 'ellipsis-start', 19, 20]);
  });

  it('shows a single hidden page instead of an ellipsis', () => {
    expect(getPageWindow(4, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
    expect(getPageWindow(5, 8)).toEqual([1, 'ellipsis-start', 4, 5, 6, 7, 8]);
  });

  it('clamps an out-of-range current page', () => {
    expect(getPageWindow(99, 10)).toEqual([1, 'ellipsis-start', 9, 10]);
    expect(getPageWindow(-3, 10)).toEqual([1, 2, 'ellipsis-end', 10]);
  });
});

describe('PaginationLinks', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      <PaginationLinks page={1} totalPages={1} hrefFor={hrefFor} linkComponent={TestLink} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders real URLs for each page, marks the current one, and links prev/next', () => {
    render(
      <PaginationLinks
        page={3}
        totalPages={9}
        hrefFor={hrefFor}
        linkComponent={TestLink}
        label="Article pages"
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Article pages' });
    const current = within(nav).getByText('3', { selector: 'a' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.getAttribute('href')).toBe('/articles?page=3');

    expect(within(nav).getByRole('link', { name: 'Page 2' }).getAttribute('href')).toBe(
      '/articles?page=2',
    );
    expect(within(nav).getByRole('link', { name: 'Previous page' }).getAttribute('rel')).toBe(
      'prev',
    );
    expect(within(nav).getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
      '/articles?page=4',
    );
  });

  it('shows previous/next as inert on the first and last page', () => {
    const { rerender } = render(
      <PaginationLinks page={1} totalPages={4} hrefFor={hrefFor} linkComponent={TestLink} />,
    );
    expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Next page' })).toBeTruthy();

    rerender(
      <PaginationLinks page={4} totalPages={4} hrefFor={hrefFor} linkComponent={TestLink} />,
    );
    expect(screen.queryByRole('link', { name: 'Next page' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Previous page' })).toBeTruthy();
  });
});
