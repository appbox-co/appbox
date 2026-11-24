"use client"

import { useSearchParams } from "next/navigation"
import { supportedLocales, usePathname, useRouter } from "@/i18n/routing"

export type Locale = (typeof supportedLocales)[number]

/**
 * Switches the page to another language. The choice goes in the cookie the
 * current design's picker uses, and the query string is kept, so ?redirect=
 * on the sign-in pages and ?aff= on the home page survive the switch.
 */
export function useChangeLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams().toString()

  return (next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`
    router.replace(search ? `${pathname}?${search}` : pathname, {
      locale: next
    })
  }
}
