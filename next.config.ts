import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  allowedDevOrigins: ["10.170.157.215", "10.245.192.215"],
};

export default nextConfig;
