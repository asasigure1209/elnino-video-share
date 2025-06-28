/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLintを無効化 (Biomeを使用)
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
