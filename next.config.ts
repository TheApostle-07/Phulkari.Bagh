// next.config.mjs
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // ... any other configuration options
};

export default nextConfig;