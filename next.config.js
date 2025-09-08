/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'export' output to allow dynamic API routes (SSE, webhooks)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
