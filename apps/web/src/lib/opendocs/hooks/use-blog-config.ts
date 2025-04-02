import { routing } from "@/i18n/routing"
import type { BlogConfig } from "@/lib/opendocs/types/blog"
import { useLocale } from "next-intl"
import { useEffect, useState } from "react"
import type { LocaleOptions } from "../types/i18n"

export function useBlogConfig() {
  const locale = useLocale() as LocaleOptions
  const currentLocale = locale || routing.defaultLocale

  const [blogConfig, setBlogConfig] = useState<{
    currentLocale: LocaleOptions
    blog: BlogConfig
  }>({
    currentLocale,

    blog: {
      mainNav: [],
      authors: [],
      rss: [],
    },
  })

  useEffect(() => {
    import(`@/config/blog`).then(({ blogConfig }) => {
      setBlogConfig({
        currentLocale,
        blog: blogConfig,
      })
    })
  }, [currentLocale])

  return blogConfig
}
