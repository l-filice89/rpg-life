import type { NextConfig } from 'next';
import path from 'node:path';

// API_URL is read at build time so the rewrite destination is baked into the
// standalone output. The web Dockerfile passes it as a build arg (defaults to
// the compose service host) so the proxy targets the api service, not loopback.
const apiUrl = process.env.API_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@rpg-life/api', '@rpg-life/auth', '@rpg-life/ui'],
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${apiUrl}/api/auth/:path*` },
      { source: '/api/trpc/:path*', destination: `${apiUrl}/api/trpc/:path*` },
    ];
  },
};

export default nextConfig;
