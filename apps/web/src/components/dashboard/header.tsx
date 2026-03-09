"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { I18nToggle } from "@/components/shared/i18n-toggle"
import { Icons } from "@/components/shared/icons"
import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle"
import { ROUTES } from "@/constants/routes"
import { MobileSidebar } from "./mobile-sidebar"
import { NotificationDropdown } from "./notification-dropdown"
import { UserMenu } from "./user-menu"

export function DashboardHeader() {
  const t = useTranslations("dashboard.header")

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[250px] z-40 h-[75px] bg-header-bg/85 backdrop-blur-md transition-all duration-300">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <Link
            href={ROUTES.DASHBOARD}
            className="hidden lg:flex items-center text-foreground"
          >
            <Icons.sitename className="w-32" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <I18nToggle
            messages={{
              toggleLanguage: t("toggle_language")
            }}
          />
          <ThemeModeToggle
            messages={{
              dark: t("theme_dark"),
              light: t("theme_light"),
              system: t("theme_system")
            }}
          />
          <UserMenu />
        </div>
      </div>
      {/* Gradient glow separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#6366f1]/30 to-transparent" />
    </header>
  )
}
