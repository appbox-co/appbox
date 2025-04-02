const { createContentlayerPlugin } = require('next-contentlayer2')

const withContentlayer = createContentlayerPlugin({})

const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['appbox.co', 'api.appbox.co'],
  },
}

module.exports = withNextIntl(withContentlayer(nextConfig))
