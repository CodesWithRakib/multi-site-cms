import path from 'node:path';
import { securityHeaders } from '@multi-site-cms/config/security-headers';
import type { NextConfig } from 'next';

const repositoryRoot = path.resolve(process.cwd(), '../../..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@multi-site-cms/config', '@multi-site-cms/validation', '@multi-site-cms/ui'],
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
