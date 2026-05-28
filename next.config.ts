import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
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
        hostname: "play-lh.googleusercontent.com",
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
