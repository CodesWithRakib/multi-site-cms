/**
 * Framework-agnostic baseline response headers for public web applications.
 *
 * HSTS is intentionally owned by the deployment platform/CDN because it has no
 * effect over local HTTP and must only be enabled when HTTPS is guaranteed.
 * A nonce-based Content Security Policy is deferred until the rendering and
 * third-party integration surface is known.
 */
export const securityHeaders = Object.freeze([
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]);
