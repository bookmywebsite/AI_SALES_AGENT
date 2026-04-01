/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  allowedDevOrigins: [
    'aquarial-scrappingly-brittanie.ngrok-free.dev',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'aquarial-scrappingly-brittanie.ngrok-free.dev',
      ],
    },
  },
};

module.exports = nextConfig;