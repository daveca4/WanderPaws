/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'wanderpaws-images.s3.amazonaws.com'],
  },
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-query']
  }
}

module.exports = nextConfig; 