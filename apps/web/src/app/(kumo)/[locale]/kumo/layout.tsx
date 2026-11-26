import type { Metadata } from "next"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { notFound } from "next/navigation"
import { canOpenKumo } from "@/config/kumo-access"
import { routing } from "@/i18n/routing-config"
import { getServerSession } from "@/lib/auth/session"
import { fontSans } from "@/lib/fonts"
import "@/styles/kumo-prototype.css"
import { KumoProviders } from "./_components/kumo-providers"

export const metadata: Metadata = {
  title: "Appbox · Kumo prototype",
  robots: { index: false, follow: false }
}

interface KumoRootLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/**
 * Separate root layout for the Kumo design prototype. It deliberately does not
 * import globals.css, so the prototype shows Kumo on its own and the existing
 * pages are unaffected. Moving between the two trees is a full page load.
 */
export default async function KumoRootLayout({
  children,
  params
}: KumoRootLayoutProps) {
  // Any first segment reaches this tree as [locale] (`/fonts/kumo`), so only
  // real locales get a page.
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // The request proxy already turns away whoever may not open Kumo
  // (config/kumo-access.ts). This is the backstop, should a request get past it.
  const session = await getServerSession()
  if (!canOpenKumo(session?.user.roles)) notFound()

  const messages = await getMessages()
  const dir = locale === "ar" || locale === "ur" ? "rtl" : "ltr"

  return (
    // data-theme="appbox": Appbox's colours and shapes over Kumo's defaults (kumo-prototype.css).
    <html lang={locale} dir={dir} data-theme="appbox" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} min-h-screen bg-kumo-canvas font-sans text-base text-kumo-default antialiased`}
      >
        <ThemeProvider attribute="data-mode" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <KumoProviders>{children}</KumoProviders>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
