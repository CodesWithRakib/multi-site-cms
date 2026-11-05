import path from 'node:path';
import { securityHeaders } from '@multi-site-cms/config/security-headers';
import type { NextConfig } from 'next';

const repositoryRoot = path.resolve(process.cwd(), '../..');

/**
 * Same-origin API proxy (SEC-22). In production the admin and the API live on
 * different sites (Vercel, Render), where the session and CSRF cookies cannot
 * work. With API_PROXY_TARGET set (e.g. https://<api>.onrender.com), requests
 * to <admin>/api/v1/* are forwarded to the API, so the browser only talks to
 * its own origin; NEXT_PUBLIC_API_URL is then <admin origin>/api/v1. Unset in
 * local development, where both run on localhost.
 */
function apiProxyTarget(): string | null {
  const raw = process.env.API_PROXY_TARGET?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('API_PROXY_TARGET must use https (except for localhost).');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('API_PROXY_TARGET must be an origin only, e.g. https://api.example.com');
  }
  return url.origin;
}

const proxyTarget = apiProxyTarget();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    '@multi-site-cms/config',
    '@multi-site-cms/validation',
    '@multi-site-cms/ui',
    '@multi-site-cms/redux',
    '@multi-site-cms/api-client',
    '@multi-site-cms/types',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/api/v1/media/assets/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '/api/v1/media/assets/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  outputFileTracingRoot: repositoryRoot,
  turbopack: {
    root: repositoryRoot,
  },
  async rewrites() {
    return proxyTarget
      ? [{ source: '/api/v1/:path*', destination: `${proxyTarget}/api/v1/:path*` }]
      : [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
