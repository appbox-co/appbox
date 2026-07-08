import { getRequestConfig } from "next-intl/server"
import deepmerge from "deepmerge"
import { routing } from "./routing-config"

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

  const messages = deepmerge(defaultMessages, userMessages, {
    // Locale arrays like hero flipwords should replace the English defaults.
    arrayMerge: (_destinationArray, sourceArray) => sourceArray
  })

  return {
    locale,
    messages
  }
})
