import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Usamos el API v2 en el puerto 3001
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:3001";

    // Normalizar la URL: Railway public/internal URLs
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      // Usar http para local y https para el resto (Railway) para evitar redirecciones 301.
      const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
      apiUrl = isLocal ? `http://${apiUrl}` : `https://${apiUrl}`;
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${apiUrl}/auth/:path*`,
      },

    ];
  },
};

export default nextConfig;
