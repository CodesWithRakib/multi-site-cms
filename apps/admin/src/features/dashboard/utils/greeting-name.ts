/**
 * Name used in the dashboard greeting: the first token of the display name
 * that is not an honorific/abbreviation ("Md.", "Dr."), so "Md. Rakib Islam"
 * is greeted as "Rakib". Falls back to the whole name, or null when empty.
 */
export function greetingName(displayName: string | null | undefined): string | null {
  const name = displayName?.trim();
  if (!name) return null;
  const tokens = name.split(/\s+/);
  return tokens.find((token) => !token.endsWith('.')) ?? name;
}
