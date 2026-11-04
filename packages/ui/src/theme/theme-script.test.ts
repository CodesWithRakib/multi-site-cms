import { describe, expect, it } from 'vitest';

import { themeInitScript } from './theme-script';

describe('themeInitScript', () => {
  it('produces syntactically valid JavaScript', () => {
    // Compiling (not running) the source proves it parses.
    expect(() => new Function(themeInitScript('site_theme'))).not.toThrow();
  });

  it('JSON-encodes the storage key so quotes cannot break out of the string', () => {
    const script = themeInitScript(`x'");alert(1);//`);

    expect(script).toContain(JSON.stringify(`x'");alert(1);//`));
    expect(() => new Function(script)).not.toThrow();
  });

  it('falls back to the given default theme', () => {
    expect(themeInitScript('k', 'dark')).toContain('d="dark"');
    expect(themeInitScript('k')).toContain('d="system"');
  });
});
