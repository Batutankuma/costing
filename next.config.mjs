import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  assetPrefix: "/exp1-static",
  transpilePackages: ["@workspace/ui"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],    
  },
  // Ensure Prisma native engines are not bundled and work in production server runtime
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Allow cross-origin requests from specific origins in development
  allowedDevOrigins: ["10.60.97.220"],
}

export default nextConfig
