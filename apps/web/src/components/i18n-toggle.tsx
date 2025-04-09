"use client"

import { useLocale } from "next-intl"
import { LanguagesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"
import { routing, usePathname, useRouter } from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import { cn } from "@/lib/utils"

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
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="w-fit gap-1 px-2 py-4 flex">
            <LanguagesIcon className="size-[1.2rem] transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{messages.toggleLanguage}</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="flex flex-col items-center p-2">
            <div className="w-full">
              {locales.map(([locale, label]) => (
                <Button
                  key={locale}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    currentLocale === locale && "font-bold"
                  )}
                  disabled={currentLocale === locale}
                  onClick={() => changeLocale(locale as LocaleOptions)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
