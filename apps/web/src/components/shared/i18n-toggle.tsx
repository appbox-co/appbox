"use client"

import { useLocale } from "next-intl"
import { Check, LanguagesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { routing, usePathname, useRouter } from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"

interface I18nToggleProps {
  messages: {
    toggleLanguage: string
  }
}

const labels = {
  [routing.defaultLocale]: "English",
  de: "Deutsch"
} as const

const locales = Object.entries(labels)

export function I18nToggle({ messages }: I18nToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  function changeLocale(locale: LocaleOptions) {
    router.replace(pathname, {
      locale
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <LanguagesIcon className="size-[1.2rem]" />
          <span className="sr-only">{messages.toggleLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map(([locale, label]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale as LocaleOptions)}
            className="flex items-center justify-between"
          >
            {label}
            {currentLocale === locale && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
