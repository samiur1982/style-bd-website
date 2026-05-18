import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow all local public assets
    localPatterns: [
      { pathname: '/media/**' },
      { pathname: '/images/**' },
      { pathname: '/**' },   // catch-all for placeholder, icons, etc.
    ],
    // Remote images (e.g. from Laravel backend)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [48, 56, 96, 128, 256, 512],
  },
};

export default nextConfig;
