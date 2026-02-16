/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force rebuild with unique build ID - 2026-02-16
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    domains: ['localhost', 'vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
