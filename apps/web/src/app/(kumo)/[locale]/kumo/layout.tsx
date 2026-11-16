import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
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
  const { locale } = await params
  const messages = await getMessages()
  const dir = locale === "ar" || locale === "ur" ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
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
