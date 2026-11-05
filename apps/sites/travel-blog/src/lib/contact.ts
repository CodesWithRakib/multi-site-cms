const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

/**
 * Editorial contact address from `NEXT_PUBLIC_CONTACT_EMAIL`. Returns null when
 * unset or malformed, so the page never shows an invented address.
 */
export function parseContactEmail(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

/** E.164: "+" then 8–15 digits (spaces and dashes in the env value are ignored). */
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export interface ContactPhone {
  /** For the tel: link, e.g. "+8801767476724". */
  readonly href: string;
  /** For display, e.g. "+880 1767-476724" for Bangladesh, else the E.164 value. */
  readonly label: string;
}

/**
 * Editorial phone number from `NEXT_PUBLIC_CONTACT_PHONE` (international
 * format). Returns null when unset or malformed, so no number is invented.
 */
export function parseContactPhone(value: string | undefined): ContactPhone | null {
  const normalized = value?.replace(/[\s-]/g, '') ?? '';
  if (!PHONE_PATTERN.test(normalized)) return null;
  const bangladesh = normalized.match(/^\+880(\d{4})(\d{6})$/);
  return {
    href: normalized,
    label: bangladesh ? `+880 ${bangladesh[1]}-${bangladesh[2]}` : normalized,
  };
}

export interface ContactMessage {
  readonly name: string;
  readonly subject: string;
  readonly message: string;
}

/**
 * Builds a `mailto:` link that opens the reader's email client with the
 * message prefilled. Nothing is sent by this site.
 */
export function buildContactMailto(to: string, { name, subject, message }: ContactMessage): string {
  const body = `${message.trim()}\n\n— ${name.trim()}`;
  const query = `subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
  return `mailto:${to}?${query}`;
}
