import path from 'node:path';
import { securityHeaders } from '@multi-site-cms/config/security-headers';
import type { NextConfig } from 'next';

const repositoryRoot = path.resolve(process.cwd(), '../..');

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
