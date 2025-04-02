import deepmerge from "deepmerge"
import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

// Add a type that matches the routing.locales union type
type SupportedLocale = (typeof routing.locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as SupportedLocale)) {
    locale = routing.defaultLocale
  }

  const userMessages = (await import(`@/i18n/locales/${locale}.json`)).default
  const defaultMessages = (await import(`@/i18n/locales/en.json`)).default

  const messages = deepmerge(defaultMessages, userMessages)

  return {
    locale,
    messages,
  }
})
