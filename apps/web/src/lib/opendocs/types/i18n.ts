import { routing } from '@/i18n/routing'

export type Locales = (typeof routing.locales)[number]
export type LocaleOptions = (typeof routing.locales)[number]

export type LocalizedRecord = Partial<{
  [key in LocaleOptions]: string
}>

export type IntlMessages = typeof import('@/i18n/locales/en.json')
