import { describe, expect, it } from 'vitest';

import { buildContactMailto, parseContactEmail, parseContactPhone } from './contact';

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

describe('parseContactPhone', () => {
  it('accepts international numbers and formats Bangladeshi mobiles', () => {
    expect(parseContactPhone('+8801767476724')).toEqual({
      href: '+8801767476724',
      label: '+880 1767-476724',
    });
    expect(parseContactPhone(' +880 1767-476724 ')?.href).toBe('+8801767476724');
    expect(parseContactPhone('+14155552671')).toEqual({
      href: '+14155552671',
      label: '+14155552671',
    });
  });

  it('never shows a malformed or missing number', () => {
    expect(parseContactPhone(undefined)).toBeNull();
    expect(parseContactPhone('')).toBeNull();
    expect(parseContactPhone('8801767476724')).toBeNull(); // no "+"
    expect(parseContactPhone('+12')).toBeNull();
    expect(parseContactPhone('+880abc')).toBeNull();
  });
});
