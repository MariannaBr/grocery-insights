/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"]
    }
  },
  images: {
    domains: ["localhost"]
  },
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: "10mb"
      }
    }
  }
};

module.exports = nextConfig;
