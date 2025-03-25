/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'wanderpaws-images.s3.amazonaws.com',
      'images.unsplash.com',
      'randomuser.me',
      'cloudflare-ipfs.com',
      'i.pravatar.cc'
    ],
  },
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-query']
  }
}

module.exports = nextConfig; 