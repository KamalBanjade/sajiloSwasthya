import type { NextConfig } from "next";
import os from "os";

// Helper to auto-detect localhost IP for the console message if env is missing
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    // Strict filters to avoid virtual/non-Wi-Fi adapters on Windows
    if (lowerName.includes('veth') ||
      lowerName.includes('docker') ||
      lowerName.includes('vmware') ||
      lowerName.includes('virtualbox') ||
      lowerName.includes('bluetooth') ||
      lowerName.includes('tunnel') ||
      lowerName.includes('zerotier') ||
      lowerName.includes('tap') ||
      lowerName.includes('multiplexor') ||
      lowerName.includes('vbox')) continue;

    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.info(`[Auto-Detect] Found Network IP: ${iface.address} on interface "${name}"`);
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? `http://${localIp}:5004/api`;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://${localIp}:3000`;
const backendOrigin = apiUrl.replace(/\/api$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Proxy /api/* to the ASP.NET backend (avoids CORS issues on same-machine dev)
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        // Proxy SignalR WebSockets to the ASP.NET backend
        destination: `${backendOrigin}/hubs/:path*`,
      },
    ];
  },
  output: "standalone",
  serverExternalPackages: [],
};

export default nextConfig;
