import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { routing } from "@/i18n/routing"
import type { DocsConfig } from "@/lib/opendocs/types/docs"
import type { LocaleOptions } from "../types/i18n"

export function useDocsConfig() {
  const locale = useLocale() as LocaleOptions
  const currentLocale = locale || routing.defaultLocale

  const [docsConfig, setDocsConfig] = useState<{
    currentLocale: LocaleOptions
    docs: DocsConfig
  }>({
    currentLocale,

    docs: {
      mainNav: [],
      sidebarNav: []
    }
  })

  useEffect(() => {
    import(`@/config/docs`).then(({ docsConfig }) => {
      setDocsConfig({
        currentLocale,
        docs: docsConfig
      })
    })
  }, [currentLocale])

  return docsConfig
}
