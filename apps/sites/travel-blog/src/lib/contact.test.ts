import { describe, expect, it } from 'vitest';

import { buildContactMailto, parseContactEmail } from './contact';

describe('parseContactEmail', () => {
  it('accepts a plain address and trims it', () => {
    expect(parseContactEmail('  editors@example.org ')).toBe('editors@example.org');
  });

  it.each([undefined, '', '   ', 'not-an-email', 'a@b', 'x@y.z?cc=evil@example.com', 'a b@c.d'])(
    'rejects %j',
    (value) => {
      expect(parseContactEmail(value)).toBeNull();
    },
  );
});

describe('buildContactMailto', () => {
  it('encodes subject and body so user input cannot add headers', () => {
    const href = buildContactMailto('editors@example.org', {
      name: 'Alex',
      subject: 'Hi&cc=attacker@example.com',
      message: 'Line one\nLine two',
    });

    expect(href.startsWith('mailto:editors@example.org?subject=')).toBe(true);
    expect(href).not.toContain('&cc=');
    expect(href).toContain('Hi%26cc%3Dattacker%40example.com');
    expect(href).toContain('body=Line%20one%0ALine%20two%0A%0A%E2%80%94%20Alex');
  });
});
