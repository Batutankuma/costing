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
  // Allow cross-origin requests from specific origins in development
  allowedDevOrigins: ["10.60.97.220"],
}

export default nextConfig
