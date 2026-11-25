import { getPathname, routing } from "@/i18n/routing"

/**
 * Puts the locale in front of a path that has none, as the current design's
 * login page does before its full-page load.
 */
export function localiseDestination(destination: string, locale: string) {
  const pathname = destination.split(/[?#]/)[0]
  const hasLocalePrefix = routing.locales.some(
    (code) => pathname === `/${code}` || pathname?.startsWith(`/${code}/`)
  )
  return hasLocalePrefix
    ? destination
    : getPathname({ href: destination, locale })
}
