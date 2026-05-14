import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"
import type { LocalizedRecord } from "@/lib/opendocs/types/i18n"

export const supportedLocales = [
  "ar",
  "bn",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "fi",
  "fr",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "mr",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sl",
  "sr",
  "sv",
  "te",
  "th",
  "tr",
  "uk",
  "ur",
  "zh"
] as const

export const localeNames: Record<(typeof supportedLocales)[number], string> = {
  ar: "العربية",
  bn: "বাংলা",
  cs: "Čeština",
  da: "Dansk",
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  es: "Español",
  fi: "Suomi",
  fr: "Français",
  hi: "हिन्दी",
  hr: "Hrvatski",
  hu: "Magyar",
  id: "Bahasa Indonesia",
  it: "Italiano",
  ja: "日本語",
  mr: "मराठी",
  nl: "Nederlands",
  no: "Norsk",
  pl: "Polski",
  pt: "Português",
  ro: "Română",
  ru: "Русский",
  sl: "Slovenščina",
  sr: "Српски",
  sv: "Svenska",
  te: "తెలుగు",
  th: "ไทย",
  tr: "Türkçe",
  uk: "Українська",
  ur: "اردو",
  zh: "中文"
} as const

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: supportedLocales,

  // Used when no locale matches
  defaultLocale: "en",

  localePrefix: "as-needed"
})

export const dateLocales: LocalizedRecord = {
  ar: "ar",
  bn: "bn-BD",
  cs: "cs-CZ",
  da: "da-DK",
  de: "de-DE",
  el: "el-GR",
  en: "en-US",
  es: "es-ES",
  fi: "fi-FI",
  fr: "fr-FR",
  hi: "hi-IN",
  hr: "hr-HR",
  hu: "hu-HU",
  id: "id-ID",
  it: "it-IT",
  ja: "ja-JP",
  mr: "mr-IN",
  nl: "nl-NL",
  no: "nb-NO",
  pl: "pl-PL",
  pt: "pt-BR",
  ro: "ro-RO",
  ru: "ru-RU",
  sl: "sl-SI",
  sr: "sr-RS",
  sv: "sv-SE",
  te: "te-IN",
  th: "th-TH",
  tr: "tr-TR",
  uk: "uk-UA",
  ur: "ur-PK",
  zh: "zh-CN"
} as const

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
