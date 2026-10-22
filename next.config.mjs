import createMDX from '@next/mdx';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const withMDX = createMDX({});
export default withMDX({
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
});
