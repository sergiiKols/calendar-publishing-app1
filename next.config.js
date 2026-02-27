/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Force rebuild with unique build ID - 2026-02-16
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    domains: ['localhost', 'vercel.app', 'calendar.energo-audit.online'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Trust proxy headers for HTTPS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
