import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"
import type { LocalizedRecord } from "@/lib/opendocs/types/i18n"

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "de", "pt"],

  // Used when no locale matches
  defaultLocale: "en",

  localePrefix: "as-needed"
})

export const dateLocales: LocalizedRecord = {
  en: "en-US",
  de: "de-DE",
  pt: "pt-BR"
} as const

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
