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
import { localeNames, supportedLocales, usePathname, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"

interface I18nToggleProps {
  messages: {
    toggleLanguage: string
  }
  labelMode?: "code" | "name"
  showLabel?: boolean
}

export function I18nToggle({
  messages,
  labelMode = "code",
  showLabel = true
}: I18nToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as LocaleOptions
  const currentLabel = localeNames[currentLocale] || currentLocale
  const visibleLabel =
    labelMode === "name" ? currentLabel : currentLocale.toUpperCase()

  function changeLocale(locale: LocaleOptions) {
    router.replace(pathname, {
      locale
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-9 gap-2 px-2", !showLabel && "w-9 px-0")}
          aria-label={`${messages.toggleLanguage}: ${currentLabel}`}
        >
          <LanguagesIcon className="size-[1.2rem] shrink-0" />
          {showLabel && (
            <span className="hidden max-w-24 truncate text-xs font-medium sm:inline">
              {visibleLabel}
            </span>
          )}
          <span className="sr-only">{messages.toggleLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className="flex items-center justify-between"
          >
            {localeNames[locale]}
            {currentLocale === locale && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
