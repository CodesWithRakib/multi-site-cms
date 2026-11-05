/**
 * Human-readable message from a failed API call. RTK Query errors from the
 * platform API are `{ status, code, message }` (packages/redux); anything else
 * falls back to the given text, so internals are never shown raw.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown };
    if (typeof message === 'string' && message.trim() !== '') return message;
  }
  return fallback;
}
