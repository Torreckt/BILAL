// PREVIEW_BASE is only for the static look-only copy published under a sub-path (see scripts/static-preview.mjs).
const previewBase = process.env.PREVIEW_BASE;

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(previewBase && { basePath: previewBase, assetPrefix: previewBase, distDir: ".next-preview" }),
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 2678400, unoptimized: !!previewBase },
  experimental: { serverActions: { bodySizeLimit: "40mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // The eye animation reads device tilt on phones; everything else is switched off.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(self), gyroscope=(self)" },
        ],
      },
      { source: "/work/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
    ];
  },
  // The site used to live under /BILAL on GitHub Pages; old links keep working on the new domain.
  async redirects() {
    return [
      { source: "/BILAL", destination: "/", permanent: true },
      { source: "/BILAL/v1/:path*", destination: "/", permanent: true },
      { source: "/BILAL/v2/:path*", destination: "/", permanent: true },
      { source: "/BILAL/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
