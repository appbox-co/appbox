import type { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#181423",
    display: "standalone",

    icons: [
      {
        src: "/appbox-box-white.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  }
}
