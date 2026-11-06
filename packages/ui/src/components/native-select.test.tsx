import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { NativeSelect } from './native-select';

// jsdom lacks the pointer-capture and scrolling APIs Radix Select calls.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

const SITES = [
  { value: '', label: 'All websites' },
  { value: 'travel', label: 'Travel Blog' },
  { value: 'air', label: 'Air Sports' },
];

function open(trigger: HTMLElement) {
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
}

describe('NativeSelect', () => {
  it('shows the label of the current value, including an empty "All" option', () => {
    const { rerender } = render(
      <NativeSelect aria-label="Site" value="" onValueChange={() => {}} options={SITES} />,
    );
    expect(screen.getByRole('combobox', { name: 'Site' }).textContent).toContain('All websites');

    rerender(
      <NativeSelect aria-label="Site" value="air" onValueChange={() => {}} options={SITES} />,
    );
    expect(screen.getByRole('combobox', { name: 'Site' }).textContent).toContain('Air Sports');
  });

  it('shows the placeholder when nothing is chosen and there is no empty option', () => {
    render(
      <NativeSelect
        aria-label="Site"
        value=""
        placeholder="Choose a site"
        onValueChange={() => {}}
        options={SITES.slice(1)}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Site' }).textContent).toContain('Choose a site');
  });

  it('reports plain string values, mapping the empty option back to ""', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NativeSelect aria-label="Site" value="air" onValueChange={onValueChange} options={SITES} />,
    );

    open(screen.getByRole('combobox', { name: 'Site' }));
    fireEvent.click(screen.getByRole('option', { name: 'All websites' }));
    expect(onValueChange).toHaveBeenLastCalledWith('');

    rerender(
      <NativeSelect aria-label="Site" value="" onValueChange={onValueChange} options={SITES} />,
    );
    open(screen.getByRole('combobox', { name: 'Site' }));
    fireEvent.click(screen.getByRole('option', { name: 'Travel Blog' }));
    expect(onValueChange).toHaveBeenLastCalledWith('travel');
  });

  it('associates with an external <label> through id', () => {
    render(
      <>
        <label htmlFor="site-select">Website</label>
        <NativeSelect id="site-select" value="travel" onValueChange={() => {}} options={SITES} />
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Website' })).toBeTruthy();
  });
});
