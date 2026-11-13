import type { ReactNode } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Icons } from "@/components/shared/icons"
import { ThemeModeToggle } from "@/components/shared/theme-mode-toggle"
import { Toaster } from "@/components/ui/sonner"
import { Link } from "@/i18n/routing"

export const metadata: Metadata = {
  robots: { index: false, follow: false }
}

// Deliberately not in proxy.ts protectedPatterns: the session cookie is
// SameSite=Strict, so it isn't sent on the redirect from the client's site.
// The consent page checks the session itself with a same-site request.
export default async function OAuthLayout({
  children
}: {
  children: ReactNode
}) {
  const t = await getTranslations("site")

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8">
        <Link href="/" className="inline-flex items-center">
          <Icons.sitename className="h-7 w-auto text-foreground" />
        </Link>

        {/* No language toggle: it navigates without the query string, which
            would lose the consent request. */}
        <ThemeModeToggle
          messages={{
            dark: t("themes.dark"),
            light: t("themes.light"),
            system: t("themes.system")
          }}
        />
      </div>

      <main className="flex flex-1 justify-center px-4 py-8 sm:items-center sm:px-8">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      <Toaster />
    </div>
  )
}
