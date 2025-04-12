/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip static generation for API routes to avoid timeouts
  staticPageGenerationTimeout: 120,
  output: 'standalone',
  // Set all API routes to be dynamically rendered
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'x-skip-static',
            value: 'true',
          },
        ],
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/dashboard/status',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig 