import type { Metadata, Viewport } from "next"
import { getMessages } from "next-intl/server"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import "@/styles/globals.css"
import { NextIntlClientProvider } from "next-intl"
import Script from "next/script"
import { Analytics } from "@/components/marketing/analytics"
import { MarketingScreenshotMode } from "@/components/marketing/marketing-screenshot-mode"
import { siteConfig } from "@/config/site"
import { routing } from "@/i18n/routing"
import { fontSans } from "@/lib/fonts"
import { getObjectValueByLocale } from "@/lib/opendocs/utils/locale"
import { cn } from "@/lib/utils"
import { PostHogProvider } from "@/providers/posthog-provider"
import { TanstackQueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import "@/styles/custom-styles.css"

interface AppLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const params = await props.params
  const locale = params.locale as LocaleOptions

  return {
    metadataBase: new URL(siteConfig.url || "https://www.appbox.co"),

    alternates: {
      canonical: "./"
    },

    title: {
      default: siteConfig.name,
      template: `%s - ${siteConfig.name}`
    },

    description: getObjectValueByLocale(siteConfig.description, locale),

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

      description: getObjectValueByLocale(siteConfig.description, locale),

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
      icon: [
        {
          url: "/icon-dark.svg",
          sizes: "any",
          type: "image/svg+xml"
        },
        {
          url: "/icon.png",
          sizes: "96x96",
          type: "image/png"
        },
        {
          url: "/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png"
        }
      ],
      apple: [
        {
          url: "/apple-icon.png",
          sizes: "180x180",
          type: "image/png"
        }
      ],
      shortcut: "/favicon.ico"
    },

    manifest: siteConfig.url
      ? `${siteConfig.url}/manifest.webmanifest`
      : "/manifest.webmanifest"
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
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
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
        <MarketingScreenshotMode />
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
                {children}
              </PostHogProvider>
            </NextIntlClientProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
