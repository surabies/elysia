import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      cn: './src/lib/utils.ts',
    },
  },
};

export default nextConfig;
