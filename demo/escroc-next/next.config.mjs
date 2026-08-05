// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;

const lanDevOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },

  reactCompiler: true,

  allowedDevOrigins: lanDevOrigins,
};

export default nextConfig;
