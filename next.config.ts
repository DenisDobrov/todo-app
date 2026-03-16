import type { NextConfig } from "next";

const nextConfig = {
  // Это увеличит лимит для всех Server Actions сразу
  serverActions: {
    bodySizeLimit: '10mb',
  },
}

export default nextConfig;
