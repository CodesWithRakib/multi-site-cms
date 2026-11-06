/**
 * Public URL for a stored media asset. Remote providers (Cloudinary) store an
 * absolute URL as the key; local storage is served by this API under
 * `/media/assets/<key>`. ADR-0010: content rows keep the key, never the URL.
 */
export function publicMediaUrl(storageKey: string, apiBaseUrl: string): string {
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  const sanitizedKey = encodeURIComponent(storageKey).replace(/%2F/g, '/');
  return `${apiBaseUrl}/media/assets/${sanitizedKey}`;
}
