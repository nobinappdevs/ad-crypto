import type { NextConfig } from "next";

const lanDevOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];

const nextConfig: NextConfig = {
  output: "export", // static SPA -> out/
  images: { unoptimized: true }, // required: no image optimizer without a server
  reactCompiler: true,
  allowedDevOrigins: lanDevOrigins, // test on phone over LAN during dev
};

export default nextConfig;
