import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Script from "next/script"
import { ArrowUpRightIcon } from "lucide-react"
import { getAppDetails } from "@/api/appbox/app-details"
import { getPlans } from "@/api/appbox/plans"
import { AppConnectionsSection } from "@/components/marketing/app-connections-section"
import { AppsMarquee } from "@/components/marketing/apps-marquee"
import { DashboardPromoSection } from "@/components/marketing/dashboard-promo-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { HeroInstallPreview } from "@/components/marketing/hero-install-preview"
import { LiveInstallCounter } from "@/components/marketing/live-install-counter"
import { OpenClawPromoSection } from "@/components/marketing/openclaw-promo-section"
import { SimpleInstallPromoSection } from "@/components/marketing/simple-install-promo-section"
import { SovereignCloudSection } from "@/components/marketing/sovereign-cloud-section"
import { VpsLaunchPromoSection } from "@/components/marketing/vps-launch-promo-section"
import { Icons } from "@/components/shared/icons"
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle
} from "@/components/ui/announcement"
import { buttonVariants } from "@/components/ui/button"
import { ClientVortexWrapper } from "@/components/ui/client-vortex-wrapper"
import { FlipWords } from "@/components/ui/flip-words"
import Plans from "@/components/ui/plans"
import { launchWeekFlags } from "@/config/launch-week-flags"
import { CURRENT_PROMO_THEME, getPromoTheme } from "@/config/promo-theme"
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"
import { absoluteUrl, cn } from "@/lib/utils"

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations("site")

  const title = t("meta_title")
  const description = t("description")

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      url: absoluteUrl(`/${params.locale}`),
      description,
      images: [
        {
          ...siteConfig.og.size,
          url: siteConfig.og.image,
          alt: siteConfig.name
        }
      ]
    }
  }
}

export default async function IndexPage() {
  const t = await getTranslations()
  const promoTheme = getPromoTheme()
  const [plansData, openClawApp] = await Promise.all([
    getPlans(),
    getAppDetails("OpenClaw").catch((error) => {
      console.error("Error fetching OpenClaw details:", error)
      return null
    })
  ])

  return (
    <div className="container relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-10 md:py-14 lg:py-18">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-[4rem] bg-linear-to-br from-indigo-500/15 via-sky-500/8 to-purple-500/12 blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10 dark:to-purple-500/15 md:block" />

        <section className="grid min-h-[560px] items-start gap-10 min-[1036px]:grid-cols-2 min-[1036px]:gap-14 md:min-h-[620px]">
          <div className="flex max-w-3xl flex-col items-start text-left">
            <Link href="/blog" className="mb-7">
              <Announcement className="rounded-xl border-slate-200/80 bg-white/80 py-1 pl-4 pr-2.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <AnnouncementTag className="hidden rounded-lg sm:block">
                  <span className="mr-2">🚀</span>
                  {t("site.announcement_tag")}
                </AnnouncementTag>
                <AnnouncementTitle className="text-left">
                  {t("site.announcement")}
                  <ArrowUpRightIcon
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                </AnnouncementTitle>
              </Announcement>
            </Link>

            <h1
              className="max-w-[760px] text-balance text-left text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl xl:text-8xl [&_span]:-mr-[0.08em] [&_span]:inline-block [&_span]:bg-linear-to-r [&_span]:from-indigo-500 [&_span]:to-purple-500 [&_span]:bg-size-[calc(100%+0.16em)_100%] [&_span]:bg-clip-text [&_span]:pr-[0.08em] [&_span]:text-transparent"
              style={{
                fontFamily:
                  'Inter, var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: t.raw("site.heading") }}
            />

            <div className="mt-5 text-left text-2xl font-normal tracking-tight text-muted-foreground sm:text-3xl md:text-4xl">
              {t.raw("site.subheading").split("{flipwords}")[0]}
              <FlipWords
                words={t.raw("site.flipwords")}
                className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl md:text-4xl"
              />
              {t.raw("site.subheading").split("{flipwords}")[1]}
            </div>

            <LiveInstallCounter className="justify-start py-4" />

            <p className="max-w-2xl text-left text-lg text-muted-foreground sm:text-xl">
              {t("site.description")}
            </p>

            <div className="flex w-full flex-col items-stretch gap-3 py-6 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/apps" className={cn(buttonVariants({ size: "lg" }))}>
                {t("site.buttons.browse_apps")}
              </Link>

              <Link
                target="_blank"
                rel="noreferrer"
                href={siteConfig.links.github.url}
                title={siteConfig.links.github.label}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                <Icons.gitHub className="mr-2 size-4" />
                {siteConfig.links.github.label}
              </Link>
            </div>
          </div>

          <HeroInstallPreview app={openClawApp} />
        </section>

        {/* Bottom gradient line */}
        <div
          className="mt-8 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${promoTheme.gradientFrom}, ${promoTheme.gradientTo}, transparent)`
          }}
        />
      </div>

      {/* Background vortex/snow effect - enable for holiday theme */}
      {CURRENT_PROMO_THEME === "holiday" && (
        <div className="fixed -top-40 left-0 -z-10 w-full h-[calc(100vh+10rem)] overflow-hidden pointer-events-none">
          <ClientVortexWrapper
            mode="snow"
            backgroundColor="transparent"
            className="flex size-full"
            rangeY={300}
            baseRadius={2}
            particleCount={80}
            rangeSpeed={0.5}
            baseSpeed={0.4}
          />
        </div>
      )}

      <SimpleInstallPromoSection plansData={plansData} />

      {launchWeekFlags.day_1 && <DashboardPromoSection />}

      <section id="plans-section" className="scroll-mt-4 pt-4">
        <Plans
          data={plansData.data}
          boostEnabled={launchWeekFlags.day_2}
          messages={{
            billing_cycles: {
              monthly: t("plans.billing_cycles.monthly"),
              quarterly: t("plans.billing_cycles.quarterly"),
              semiannually: t("plans.billing_cycles.semiannually"),
              annually: t("plans.billing_cycles.annually"),
              billed_every: t("plans.billing_cycles.billed_every")
            },
            card: {
              storage: t("plans.card.storage"),
              traffic: t("plans.card.traffic"),
              app_slots: t("plans.card.app_slots"),
              connection_speed: t("plans.card.connection_speed"),
              resource_multiplier: t("plans.card.resource_multiplier"),
              included: t("plans.card.included"),
              raid: t("plans.card.raid"),
              disks: t("plans.card.disks"),
              per_month: t("plans.card.per_month"),
              order_now: t("plans.card.order_now"),
              billed_as: t("plans.card.billed_as"),
              excluded_app_categories: t("plans.card.excluded_app_categories"),
              windows_vps: t("plans.card.windows_vps"),
              windows_vps_supported: t("plans.card.windows_vps_supported"),
              windows_vps_dedicated_only: t(
                "plans.card.windows_vps_dedicated_only"
              )
            }
          }}
        />
      </section>

      {launchWeekFlags.day_3 && <VpsLaunchPromoSection />}

      <OpenClawPromoSection />

      <SovereignCloudSection />

      <AppsMarquee
        headline1={t("site.apps_section.headline_1")}
        headline2={t("site.apps_section.headline_2")}
        description={t("site.apps_section.description")}
      />

      <AppConnectionsSection
        headline1={t("home.connections_section.headline_1")}
        headline2={t("home.connections_section.headline_2")}
        description={t("home.connections_section.description")}
      />

      <FeaturesSection
        id="features"
        headline1={t("site.features.section.headline_1")}
        headline2={t("site.features.section.headline_2")}
        description={t("site.features.section.description")}
      />

      <FAQSection
        id="faq"
        title={t("site.faq.section.title")}
        description={t("site.faq.section.description")}
        showResourceMultipliers={launchWeekFlags.day_2}
        showVps={launchWeekFlags.day_5}
      />

      <Script
        id="chatwoot-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(d,t) {
              var BASE_URL="https://chatwoot.appbox.co";
              var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
              g.src=BASE_URL+"/packs/js/sdk.js";
              g.defer = true;
              g.async = true;
              s.parentNode.insertBefore(g,s);
              g.onload=function(){
                window.chatwootSDK.run({
                  websiteToken: 'A8Ddn77aZ43frViEkFT8trZg',
                  baseUrl: BASE_URL
                })
              }
            })(document,"script");
          `
        }}
      />
    </div>
  )
}
