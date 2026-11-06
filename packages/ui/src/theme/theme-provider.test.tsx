import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from './theme-provider';

const KEY = 'test_theme';

/** Stubs matchMedia so the operating system reports the given scheme. */
function mockSystemScheme(scheme: 'light' | 'dark') {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') && scheme === 'dark',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** Records every dark/light class change on <html> during the test. */
function watchHtmlClass(): string[] {
  const seen: string[] = [];
  const root = document.documentElement;
  const original = root.classList.toggle.bind(root.classList);
  vi.spyOn(root.classList, 'toggle').mockImplementation((token, force) => {
    if (token === 'dark') seen.push(force ? 'dark' : 'light');
    return original(token, force);
  });
  return seen;
}

function ThemeReadout() {
  const { theme, resolvedTheme } = useTheme();
  return <p>{`${theme}:${resolvedTheme}`}</p>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('never flashes the system theme over a saved choice on load', () => {
    // Regression: OS in dark mode, user saved "light" → the page briefly
    // turned dark during hydration before switching back to light.
    mockSystemScheme('dark');
    localStorage.setItem(KEY, 'light');
    const applied = watchHtmlClass();

    render(
      <ThemeProvider storageKey={KEY}>
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(applied).not.toContain('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(screen.getByText('light:light')).toBeTruthy();
  });

  it('follows the system scheme when nothing is saved', () => {
    mockSystemScheme('dark');
    render(
      <ThemeProvider storageKey={KEY}>
        <ThemeReadout />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByText('system:dark')).toBeTruthy();
  });

  it('saves and applies an explicit choice', () => {
    mockSystemScheme('light');
    let api: ReturnType<typeof useTheme> | undefined;
    function Capture() {
      api = useTheme();
      return null;
    }
    render(
      <ThemeProvider storageKey={KEY}>
        <Capture />
      </ThemeProvider>,
    );
    act(() => api?.setTheme('dark'));
    expect(localStorage.getItem(KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
