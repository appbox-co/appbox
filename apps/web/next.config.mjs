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
        hostname: "www.appbox.co"
      },
      {
        protocol: "https",
        hostname: "api.appbox.co"
      }
    ]
  }
}

export default withNextIntl(withContentlayer(nextConfig))
