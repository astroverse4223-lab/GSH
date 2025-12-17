/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "1000mb",
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "shared.akamai.steamstatic.com" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "assets1.ignimgs.com" },
      { protocol: "https", hostname: "assets2.ignimgs.com" },
      { protocol: "https", hostname: "assets-prd.ignimgs.com" },
      { protocol: "https", hostname: "cdn.mos.cms.futurecdn.net" },
      { protocol: "https", hostname: "i.kinja-img.com" },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "cloudinary"];
    return config;
  },
  async headers() {
    const cspValue = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      media-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://storage.googleapis.com https://*.storage.googleapis.com blob: data:;
      connect-src 'self' data: blob: https:;
      worker-src 'self' blob: data:;
      frame-src 'self' https://open.spotify.com https://*.spotify.com https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://youtube.com;
      object-src 'none';
      base-uri 'self';
    `.replace(/\n/g, " ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: cspValue },
        ],
      },
      {
        source: "/subscription/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https:;
              connect-src 'self' data: blob: https://api.stripe.com https://q.stripe.com https://r.stripe.com https://errors.stripe.com https://checkout-live.stripe.com https://merchant-ui-api.stripe.com;
              worker-src 'self' blob: data:;
              frame-src https://js.stripe.com https://hooks.stripe.com;
              object-src 'none';
              base-uri 'self';
            `.replace(/\n/g, " "),
          },
        ],
      },
      {
        source: "/api/upload",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
