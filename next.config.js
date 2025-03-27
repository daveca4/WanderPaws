/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'wanderpaws-images.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'wanderpaws.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'wanderpaws.s3.eu-central-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
    unoptimized: true
  },
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['react-query']
  }
}

module.exports = nextConfig; 