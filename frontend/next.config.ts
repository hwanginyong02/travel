import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // CI 파이프라인에서 tsc 타입 검사(npx tsc --noEmit)를 사전 완료하므로,
    // EC2 빌드 시 중복 TypeScript 검사를 생략하여 메모리 OOM 및 멈춤 현상 방지
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
