import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

import type { BlogConfig } from '@/lib/opendocs/types/blog'
import type { LocaleOptions } from '../types/i18n'

import { routing } from '@/i18n/routing'

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
