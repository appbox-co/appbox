import { withContentlayer } from "next-contentlayer2"
import nextIntlPlugin from "next-intl/plugin"

const withNextIntl = nextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "appbox.co"
      },
      {
        protocol: "https",
        hostname: "**.appbox.co"
      },
      {
        protocol: "https",
        hostname: "www.chatwoot.com"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "appbox-delta.vercel.app" }],
        missing: [
          { type: "header", key: "X-Rerouted" },
          { type: "header", key: "X-Worker-Route" }
        ],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "appbox-delta.vercel.app" }],
        missing: [
          { type: "header", key: "X-Rerouted" },
          { type: "header", key: "X-Worker-Route" }
        ],
        destination: "https://www.appbox.co/:path*",
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      // Email links use /abusecomplainant/:id?token= — serve en route without changing URL (avoids redirect loop with localePrefix as-needed)
      { source: "/abusecomplainant/:id", destination: "/en/abusecomplainant/:id" }
    ]
  }
}

export default withNextIntl(withContentlayer(nextConfig))
