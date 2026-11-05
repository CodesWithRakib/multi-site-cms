import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutosaveScheduler } from './autosave-scheduler';

describe('AutosaveScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves once, shortly after the editor pauses', () => {
    const save = vi.fn();
    const scheduler = new AutosaveScheduler(save, 2_500, 30_000);

    scheduler.touch();
    vi.advanceTimersByTime(1_000);
    scheduler.touch();
    vi.advanceTimersByTime(2_499);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves at least every interval while typing never pauses', () => {
    const save = vi.fn();
    const scheduler = new AutosaveScheduler(save, 2_500, 30_000);

    // A keystroke every second for 65 seconds.
    for (let second = 0; second < 65; second++) {
      scheduler.touch();
      vi.advanceTimersByTime(1_000);
    }
    expect(save).toHaveBeenCalledTimes(2); // at 30 s and at 60 s
  });

  it('cancels pending saves after a manual flush', () => {
    const save = vi.fn();
    const scheduler = new AutosaveScheduler(save, 2_500, 30_000);

    scheduler.touch();
    scheduler.flush();
    vi.advanceTimersByTime(60_000);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
