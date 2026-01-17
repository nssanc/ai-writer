import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 禁用 Turbopack 以支持 ARM 架构构建
  turbo: undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
