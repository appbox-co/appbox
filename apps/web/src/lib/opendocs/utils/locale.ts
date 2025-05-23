import { routing } from "@/i18n/routing"
import type { LocaleOptions } from "../types/i18n"

export function getObjectValueByLocale(
  obj: Record<string, string>,
  locale: LocaleOptions
) {
  return String(obj?.[locale] || obj?.[routing.defaultLocale])
}

export function getSlugWithoutLocale(slug: string, context: string) {
  let slugWithoutLocaleFolder = slug

  for (const locale of routing.locales) {
    const selectPathWithCurrentLocale = new RegExp(`^/${context}/(${locale})/?`)

    if (selectPathWithCurrentLocale.test(slug)) {
      slugWithoutLocaleFolder = slugWithoutLocaleFolder
        .replace(new RegExp(`${locale}/?`), "")
        .replace(/\/$/, "")
    }
  }

  return slugWithoutLocaleFolder
}
