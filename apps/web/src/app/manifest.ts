import type { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#181423",
    background_color: "#181423",
    display: "standalone",

    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  }
}
