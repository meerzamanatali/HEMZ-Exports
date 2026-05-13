/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  serverExternalPackages: ['@prisma/client', 'prisma'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@prisma/engines/**',
      'node_modules/@prisma/client/node_modules/**',
      'node_modules/.prisma/client/libquery_engine*',
      'node_modules/prisma/libquery_engine*',
      'node_modules/prisma/build/**',
    ],
  },
}

export default nextConfig