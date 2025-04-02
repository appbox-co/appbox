import { routing } from '@/i18n/routing'

import type { LocaleOptions } from '../types/i18n'

interface ServerDocsConfig {
  locale: LocaleOptions
}

export async function getServerDocsConfig({ locale }: ServerDocsConfig) {
  const { docsConfig } = await import(`@/config/docs`)

  return {
    docs: docsConfig,
    currentLocale: locale || routing.defaultLocale,
  }
}
