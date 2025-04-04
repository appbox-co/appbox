"use client"

import { useState, type PointerEvent } from "react"
import { useLocale } from "next-intl"
import { ChevronDown, LanguagesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { routing, usePathname, useRouter } from "@/i18n/routing"
import { useIsMobile } from "@/lib/opendocs/hooks/use-is-mobile"
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
  const isMobile = useIsMobile()
  const currentLocale = useLocale()
  const [open, setOpen] = useState(false)

  function openDropdown() {
    setOpen(() => true)
  }

  function closeDropdown(element: PointerEvent<HTMLElement>) {
    const target = element.relatedTarget as Element

    if ("closest" in target && target.closest("[role=menu]")) return

    setOpen(() => false)
  }

  function changeLocale(locale: LocaleOptions) {
    router.replace(pathname, {
      locale
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-expanded={open}
          className="group pointer-events-auto relative flex w-fit gap-1 px-2"
          onClick={() => isMobile && openDropdown()}
          onPointerEnter={() => !isMobile && openDropdown()}
          onPointerLeave={(event) => !isMobile && closeDropdown(event)}
        >
          <LanguagesIcon className="size-[1.2rem] transition-all dark:rotate-0 dark:scale-100" />

          <ChevronDown className="size-3 transition duration-300 group-aria-expanded:rotate-180" />

          <span className="sr-only">{messages.toggleLanguage}</span>
          <span className="pointer-events-auto absolute z-10 block h-14 w-full" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex flex-col items-center"
        align="center"
        role="menu"
        onPointerLeave={closeDropdown}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full">
          {locales.map(([locale, label]) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => changeLocale(locale as LocaleOptions)}
              disabled={currentLocale === locale}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
