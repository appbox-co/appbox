import type { Metadata, Viewport } from "next"
import { getMessages } from "next-intl/server"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import "@/styles/globals.css"
import { NextIntlClientProvider } from "next-intl"
import Script from "next/script"
import { Analytics } from "@/components/analytics"
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
import "@/styles/custom-styles.css"

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
      icon: "/appbox-box-white.svg",
      apple: "/appbox-box-white.svg",
      shortcut: "/appbox-box-white.svg"
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
        <Script
          type="text/javascript"
          strategy="afterInteractive"
          id="bing-analytics"
        >
          {`
            (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"97191021", enableAutoSpaTracking: true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
          `}
        </Script>
      </head>

      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <Script
          type="text/javascript"
          src="//embeds.iubenda.com/widgets/03e26262-624c-4f5b-8687-f85ec29afd9f.js"
          strategy="afterInteractive"
        />
        <Script src="/b5tg/" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GT-T53F3CT6');
            gtag('consent', 'update', {
              analytics_storage: 'granted',
              ad_storage: 'granted',
              functionality_storage: 'granted',
              personalization_storage: 'granted',
              security_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted'
            })
          `}
        </Script>

        <ThemeProvider enableSystem attribute="class" defaultTheme="dark">
          <TanstackQueryProvider>
            <NextIntlClientProvider messages={messages}>
              <PostHogProvider>
                <Analytics />
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
