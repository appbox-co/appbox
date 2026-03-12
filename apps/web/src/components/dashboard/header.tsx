"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Bell, LanguagesIcon, Menu, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { I18nToggle } from "@/components/shared/i18n-toggle"
import { Icons } from "@/components/shared/icons"
import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle"
import { ROUTES } from "@/constants/routes"
import { ADMIN_MODULE_AVAILABLE } from "@/lib/admin/availability"
import { cn } from "@/lib/utils"
import { useAdminMode } from "@/providers/admin-mode-provider"
import { useAuth } from "@/providers/auth-provider"
import { MobileSidebar } from "./mobile-sidebar"
import { NotificationDropdown } from "./notification-dropdown"
import { UserMenu } from "./user-menu"

export function DashboardHeader() {
  const t = useTranslations("dashboard.header")
  const { user } = useAuth()
  const { isAdminMode, toggleAdminMode } = useAdminMode()
  const canAccessAdmin = user.roles === "admin" && ADMIN_MODULE_AVAILABLE
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[250px] z-40 h-[75px] bg-header-bg/85 backdrop-blur-md transition-all duration-300">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {mounted ? (
            <MobileSidebar />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              disabled
              aria-hidden="true"
            >
              <Menu className="size-5" />
            </Button>
          )}
          <Link
            href={ROUTES.DASHBOARD}
            className="hidden lg:flex items-center text-foreground"
          >
            <Icons.sitename className="w-32" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canAccessAdmin && (
            <button
              type="button"
              onClick={toggleAdminMode}
              title={isAdminMode ? t("switch_to_user") : t("switch_to_admin")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                isAdminMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Shield className="size-3.5" />
              <span className="hidden sm:inline">
                {isAdminMode ? "Admin" : "Admin"}
              </span>
            </button>
          )}
          {mounted ? (
            <>
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
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" disabled aria-hidden="true">
                <Bell className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" disabled aria-hidden="true">
                <LanguagesIcon className="size-[1.2rem]" />
              </Button>
              <Button variant="ghost" size="icon" disabled aria-hidden="true">
                <span className="size-[1.15rem]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled
                aria-hidden="true"
              >
                <User className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#6366f1]/30 to-transparent" />
    </header>
  )
}
