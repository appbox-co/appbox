import en from "@/i18n/locales/en.json"
import { absoluteUrl } from "@/lib/utils"

export const siteConfig = {
  name: "Appbox",

  description: {
    en: en.site.description
  },

  url: process.env.NEXT_PUBLIC_APP_URL,

  og: {
    image: absoluteUrl("/og.png"),

    size: {
      width: 3200,
      height: 2521
    }
  },

  links: {
    // twitter: {
    //   label: 'Twitter',
    //   username: '@daltonmenezes',
    //   url: 'https://twitter.com/daltonmenezes',
    // },
    github: {
      label: "GitHub",
      url: "https://github.com/appbox-co/appbox"
    }
  }
} as const

export type SiteConfig = typeof siteConfig
