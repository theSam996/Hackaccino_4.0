import type { NextConfig } from "next";

const telemetryApi =
  process.env.TELEMETRY_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/telemetry/:path*",
        destination: `${telemetryApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
