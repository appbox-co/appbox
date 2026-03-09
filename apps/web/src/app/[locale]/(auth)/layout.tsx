import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { I18nToggle } from "@/components/shared/i18n-toggle"
import { Icons } from "@/components/shared/icons"
import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle"
import { Toaster } from "@/components/ui/sonner"
import { Link } from "@/i18n/routing"
import { AuthBrandingPanel } from "./_components/auth-branding-panel"

export default async function AuthLayout({
  children
}: {
  children: ReactNode
}) {
  const t = await getTranslations("site")

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* Left panel -- form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Logo + controls */}
        <div className="flex items-center justify-between px-8 pt-8">
          <Link href="/" className="inline-flex items-center">
            <Icons.sitename className="h-7 w-auto text-foreground" />
          </Link>

          <div className="flex items-center gap-1">
            <I18nToggle
              messages={{
                toggleLanguage: t("buttons.toggle_language")
              }}
            />
            <ThemeModeToggle
              messages={{
                dark: t("themes.dark"),
                light: t("themes.light"),
                system: t("themes.system")
              }}
            />
          </div>
        </div>

        {/* Centered form area */}
        <div className="flex flex-1 items-center justify-center px-8 pb-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right panel -- branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2">
        <AuthBrandingPanel />
      </div>

      <Toaster />
    </div>
  )
}
