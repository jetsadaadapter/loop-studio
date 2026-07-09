import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // Expose the package version to the client (footer) without shipping the
  // whole package.json — only this string is inlined at build time.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
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
