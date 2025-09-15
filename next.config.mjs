const nextConfig = {
  assetPrefix: "/exp1-static",
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],    
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure Prisma native engines are not bundled and work in production server runtime
  serverExternalPackages: ["@prisma/client", "prisma"],
}

export default nextConfig
