import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress Turbopack webpack-config conflict warning
  // We add an empty turbopack config so Next.js knows we're aware
  turbopack: {},

  // Webpack config — used when running `next dev --webpack` or `next build`
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        zlib: false,
      };
    }
    config.module.exprContextCritical = false;
    return config;
  },

  // Transpile Solana packages that need it
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-phantom",
    "@solana/wallet-adapter-solflare",
  ],
};

export default nextConfig;
