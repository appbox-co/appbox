import path from "node:path"
import { fileURLToPath } from "node:url"
import { withContentlayer } from "next-contentlayer2"
import nextIntlPlugin from "next-intl/plugin"

const withNextIntl = nextIntlPlugin()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, "../..")
  },
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
      {
        source: "/abusecomplainant/:id",
        destination: "/en/abusecomplainant/:id"
      },
      { source: "/reddit/order", destination: "/en/reddit/order" },
      // Dashboard routes are authored under /[locale], while default-locale URLs stay unprefixed.
      { source: "/dashboard/:path*", destination: "/en/dashboard/:path*" },
      {
        source: "/appboxmanager/:path*",
        destination: "/en/appboxmanager/:path*"
      },
      { source: "/account/:path*", destination: "/en/account/:path*" },
      { source: "/appstore/:path*", destination: "/en/appstore/:path*" },
      { source: "/login", destination: "/en/login" },
      { source: "/forgot/:path*", destination: "/en/forgot/:path*" }
    ]
  }
}

export default withNextIntl(withContentlayer(nextConfig))
