import type { Metadata, Viewport } from "next"
import { getMessages } from "next-intl/server"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import "@/styles/globals.css"
import { NextIntlClientProvider } from "next-intl"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { TanstackQueryProvider } from "@/components/providers/query-provider"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { siteConfig } from "@/config/site"
import { routing } from "@/i18n/routing"
import { fontSans } from "@/lib/fonts"
import { getObjectValueByLocale } from "@/lib/opendocs/utils/locale"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: LocaleOptions
  }>
}

export async function generateMetadata(props: {
  params: Promise<{ locale: LocaleOptions }>
}): Promise<Metadata> {
  const params = await props.params

  return {
    metadataBase: new URL(siteConfig.url || "https://www.appbox.co"),

    title: {
      default: siteConfig.name,
      template: `%s - ${siteConfig.name}`
    },

    description: getObjectValueByLocale(siteConfig.description, params.locale),

    keywords: [
      "Docs",
      "Blog",
      "i18n",
      "React",
      "shadcn",
      "Next.js",
      "Radix UI",
      "Template",
      "Tailwind CSS",
      "Documentation",
      "Server Components",
      "Internationalization"
    ],

    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: siteConfig.name,
      siteName: siteConfig.name,

      description: getObjectValueByLocale(
        siteConfig.description,
        params.locale
      ),

      images: [
        {
          ...siteConfig.og.size,
          alt: siteConfig.name,
          url: siteConfig.og.image
        }
      ]
    },

    // twitter: {
    //   creator: siteConfig.links.twitter.username,
    //   title: siteConfig.name,
    //   card: 'summary_large_image',
    //   images: [siteConfig.og.image],

    //   description: getObjectValueByLocale(
    //     siteConfig.description,
    //     params.locale
    //   ),
    // },

    icons: {
      icon: "/appboxes-white.svg",
      apple: "/appboxes-white.svg",
      shortcut: "/appboxes-white.svg"
    },

    manifest: siteConfig.url
      ? `${siteConfig.url}/site.webmanifest`
      : "/site.webmanifest"
  }
}

export const dynamicParams = true

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ]
}

export default async function RootLayout(props: AppLayoutProps) {
  const params = await props.params
  const messages = await getMessages()

  const { children } = props

  // setRequestLocale(params.locale)

  return (
    <html
      lang={params.locale.toString() || routing.defaultLocale}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#181423" />
      </head>

      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider enableSystem attribute="class" defaultTheme="dark">
          <TanstackQueryProvider>
            <NextIntlClientProvider messages={messages}>
              <PostHogProvider>
                <div>
                  <div className="relative z-10 flex min-h-screen flex-col">
                    <SiteHeader />

                    <main className="flex-1">{children}</main>

                    <SiteFooter />
                  </div>

                  <div className="fixed left-0 top-0 size-full bg-linear-to-b from-[#a277ff] via-transparent to-transparent opacity-10" />
                </div>
              </PostHogProvider>
            </NextIntlClientProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
