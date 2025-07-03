/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLintを無効化 (Biomeを使用)
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "900mb",
    },
  },
}

module.exports = nextConfig
