import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Script from "next/script"
import { ArrowUpRightIcon } from "lucide-react"
import { getPlans } from "@/api/appbox/plans"
import { AppConnectionsSection } from "@/components/marketing/app-connections-section"
import { AppsMarquee } from "@/components/marketing/apps-marquee"
import { DashboardPromoSection } from "@/components/marketing/dashboard-promo-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { LiveInstallCounter } from "@/components/marketing/live-install-counter"
import { OpenClawPromoSection } from "@/components/marketing/openclaw-promo-section"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from "@/components/marketing/page-header"
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
import { ClientGradientSwitcher } from "@/components/ui/gradient-client-switcher"
import { GradientWrapper } from "@/components/ui/gradient-wrapper"
import Plans from "@/components/ui/plans"
import { PromoBannerData } from "@/components/ui/promo-banner"
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
  const plansData = await getPlans()
  const promoTheme = getPromoTheme()

  // Extract promotion data from the first active promotion found
  const activePromotion = plansData.data
    .flatMap((group) => group.plans)
    .find((plan) => plan.promotion?.active)?.promotion

  // Create promo banner data if promotion exists
  const promoBannerData: PromoBannerData | null = activePromotion
    ? {
        active: true,
        promo_code: activePromotion.promo_code,
        title: activePromotion.title,
        description: activePromotion.description,
        discount_percentage: activePromotion.discount_percentage,
        duration_months: activePromotion.duration_months,
        badge_text: activePromotion.badge_text,
        cta_text: "View Deals",
        background_gradient: {
          from: promoTheme.gradientFrom,
          to: promoTheme.gradientTo
        }
      }
    : null

  const gradientProps = {
    width: 180,
    height: 180,
    path: "M100,100 m0,-75 a75,75 0 1,1 -0.1,0 z",
    gradientColors: ["#6366f1", "#6366f1", "#3498DB"] as [
      string,
      string,
      string
    ],
    className: "justify-center mt-6"
  }

  return (
    <div className="container relative">
      {/* Hero Section */}
      <div className="relative pt-8 md:pt-12 overflow-hidden">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes hero-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `
          }}
        />

        {/* Floating stars */}
        {[
          {
            top: "8%",
            left: "8%",
            size: "w-6 h-6",
            delay: "0s",
            duration: "3s"
          },
          {
            top: "15%",
            right: "10%",
            size: "w-8 h-8",
            delay: "1.5s",
            duration: "4s"
          },
          {
            bottom: "30%",
            left: "5%",
            size: "w-5 h-5",
            delay: "0.5s",
            duration: "3.5s"
          },
          {
            bottom: "20%",
            right: "8%",
            size: "w-7 h-7",
            delay: "2s",
            duration: "3.2s"
          },
          {
            top: "35%",
            left: "15%",
            size: "w-4 h-4",
            delay: "1s",
            duration: "3.8s"
          },
          {
            top: "25%",
            right: "20%",
            size: "w-5 h-5",
            delay: "2.5s",
            duration: "3.3s"
          }
        ].map((star, i) => (
          <div
            key={i}
            className="absolute opacity-15 dark:opacity-25 pointer-events-none"
            style={{
              top: star.top,
              left: star.left,
              right: star.right,
              bottom: star.bottom,
              animation: `hero-float ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={`${star.size} text-indigo-500 dark:text-indigo-400`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        ))}

        <div className="flex flex-col items-center">
          <div className="relative">
            <GradientWrapper {...gradientProps} />
            <div className="absolute inset-0">
              <ClientGradientSwitcher {...gradientProps} />
            </div>
          </div>
        </div>

        <PageHeader className="mb-0 gap-4 md:gap-5">
          <Link href="/blog">
            <Announcement>
              <AnnouncementTag className="hidden sm:block">
                <span className="hidden sm:inline mr-2">🚀</span>
                <span className="sm:hidden">🆕</span>
                {t("site.announcement_tag")}
              </AnnouncementTag>
              <AnnouncementTitle>
                {t("site.announcement")}
                <ArrowUpRightIcon
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
              </AnnouncementTitle>
            </Announcement>
          </Link>

          <PageHeaderHeading>
            <span
              dangerouslySetInnerHTML={{ __html: t.raw("site.heading") }}
              className="text-5xl sm:text-6xl md:text-7xl"
            />
            <div className="mt-3 text-xl sm:text-2xl md:text-3xl text-muted-foreground font-normal tracking-tight">
              {t.raw("site.subheading").split("{flipwords}")[0]}
              <FlipWords
                words={t.raw("site.flipwords")}
                className="text-xl sm:text-2xl md:text-3xl text-primary font-semibold tracking-tight"
              />
              {t.raw("site.subheading").split("{flipwords}")[1]}
            </div>
          </PageHeaderHeading>

          <LiveInstallCounter />

          <PageHeaderDescription>{t("site.description")}</PageHeaderDescription>

          <PageActions>
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
          </PageActions>

          {promoBannerData && (
            <div className="flex flex-col items-center gap-3">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${promoBannerData.background_gradient?.from || "#6366f1"} 0%, ${promoBannerData.background_gradient?.to || "#3498DB"} 100%)`
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-white shrink-0"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {promoBannerData.badge_text}
                  {promoBannerData.duration_months === 1
                    ? " on your first month"
                    : ` for ${promoBannerData.duration_months} months`}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span
                  className={`text-sm font-medium ${promoTheme.textColor} opacity-80`}
                >
                  Use code
                </span>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md ${promoTheme.badgeBg} ${promoTheme.badgeBorder} border`}
                >
                  <span
                    className={`text-lg font-bold font-mono tracking-wider ${promoTheme.badgeText}`}
                  >
                    {promoBannerData.promo_code}
                  </span>
                </div>
              </div>
            </div>
          )}
        </PageHeader>

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

      {launchWeekFlags.day_1 && <DashboardPromoSection />}

      {launchWeekFlags.day_3 && <VpsLaunchPromoSection />}

      <OpenClawPromoSection />

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

      <AppsMarquee
        title={t("site.apps_section.title")}
        description={t("site.apps_section.description")}
      />

      <AppConnectionsSection
        title={t("home.connections_section.title")}
        description={t("home.connections_section.description")}
      />

      <FeaturesSection
        id="features"
        title={t("site.features.section.title")}
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
