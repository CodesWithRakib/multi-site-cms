/**
 * When to autosave: shortly after the editor pauses (debounce), and at least
 * every `maxWaitMs` while they keep typing, so continuous editing is never
 * left unsaved for longer than the platform's autosave interval
 * (Settings → Publishing). Framework-free so it can be tested with fake timers.
 */
export class AutosaveScheduler {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly save: () => void,
    private readonly debounceMs: number,
    private readonly maxWaitMs: number,
  ) {}

  /** A change happened. */
  touch(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), this.debounceMs);
    if (!this.maxWaitTimer) {
      this.maxWaitTimer = setTimeout(() => this.flush(), this.maxWaitMs);
    }
  }

  /** Save now (also used by the manual save shortcut). */
  flush(): void {
    this.cancel();
    this.save();
  }

  cancel(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.maxWaitTimer) clearTimeout(this.maxWaitTimer);
    this.debounceTimer = null;
    this.maxWaitTimer = null;
  }
}
