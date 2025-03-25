/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'placehold.co',
      'randomuser.me',
      'i.pravatar.cc',
      'cloudflare-ipfs.com'
    ],
  },
};

module.exports = nextConfig; 