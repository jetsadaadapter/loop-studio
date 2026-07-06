import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/keys",
        destination: "/manage/keys",
        permanent: true,
      },
      {
        source: "/library/apps",
        destination: "/apps",
        permanent: true,
      },
      {
        source: "/library/apps/:slug",
        destination: "/apps/:slug",
        permanent: true,
      },
      {
        source: "/manage/ai",
        destination: "/manage/models",
        permanent: true,
      },
      {
        source: "/manage/ai/:path*",
        destination: "/manage/models/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/tools/:id/runs/:runId",
        destination: "/tool/:id/runs/:runId",
      },
      {
        source: "/tools/:id",
        destination: "/tool/:id",
      },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // X-Frame-Options cannot allow-list cross-origin framers, so it is set only
          // in production (DENY). In dev it is omitted, and framing is governed solely
          // by the CSP frame-ancestors directive (see src/proxy.ts) which allows local
          // ports — letting the Studio preview pane embed a project's dev server.
          ...(isProd ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "*.google.com",
      },
      {
        protocol: "https",
        hostname: "*.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "library-api.adapterdigital.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "*.facebook.com",
      },
      {
        protocol: "https",
        hostname: "*.akamaihd.net",
      },
      {
        protocol: "https",
        hostname: "library-api.adapterdigital.com",
        pathname: "/api/images/**",
      },
      {
        protocol: "https",
        hostname: "library.adapterdigital.com",
        pathname: "/api/images/**",
      },
    ],
    localPatterns: [
      {
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
