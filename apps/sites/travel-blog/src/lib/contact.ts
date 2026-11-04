const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

/**
 * Editorial contact address from `NEXT_PUBLIC_CONTACT_EMAIL`. Returns null when
 * unset or malformed, so the page never shows an invented address.
 */
export function parseContactEmail(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && EMAIL_PATTERN.test(trimmed) ? trimmed : null;
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
