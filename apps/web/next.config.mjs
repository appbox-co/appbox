import { createContentlayerPlugin } from "next-contentlayer2"
import nextIntlPlugin from "next-intl/plugin"

const withContentlayer = createContentlayerPlugin({})
const withNextIntl = nextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["appbox.co", "api.appbox.co"],
  },
}

export default withNextIntl(withContentlayer(nextConfig))
