/**
 * Post-login destination from the `returnUrl` query parameter. Only
 * same-origin absolute paths are accepted; anything else (external URLs,
 * protocol-relative `//host`, `/\host`, schemes) falls back to the dashboard
 * so the login page cannot be used as an open redirect.
 */
export function safeReturnUrl(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Control characters (tab, newline) are stripped by URL parsers and can
  // turn "/\t/evil.com" into "//evil.com".
  if ([...value].some(isControlCharacter)) return fallback;
  if (value === '/login' || value.startsWith('/login?')) return fallback;
  return value;
}

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code <= 0x1f || code === 0x7f;
}
