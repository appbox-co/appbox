import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Script from "next/script"
import { ArrowUpRightIcon } from "lucide-react"
import { AppConnectionsSection } from "@/components/app-connections-section"
import { AppsMarquee } from "@/components/apps-marquee"
import { FAQSection } from "@/components/faq-section"
import { FeaturesSection } from "@/components/features-section"
import { Icons } from "@/components/icons"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from "@/components/page-header"
import { PromoHeroWrapper } from "@/components/promo-hero-wrapper"
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
import { CURRENT_PROMO_THEME, getPromoTheme } from "@/config/promo-theme"
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"
import { getPlans } from "@/lib/appbox/api/getPlans"
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
        badge_text: activePromotion.badge_text,
        cta_text: "View Deals",
        background_gradient: {
          from: promoTheme.gradientFrom,
          to: promoTheme.gradientTo
        }
      }
    : null

  // Props for both gradient components
  const gradientProps = {
    width: 180,
    height: 180,
    path: "M100,100 m0,-75 a75,75 0 1,1 -0.1,0 z",
    gradientColors: ["#7B68EE", "#7B68EE", "#3498DB"] as [
      string,
      string,
      string
    ],
    className: "justify-center mt-6"
  }

  return (
    <div className="container relative">
      {/* Hero Section with Integrated Promo */}
      <PromoHeroWrapper
        hasPromo={!!promoBannerData}
        gradientFrom={promoBannerData?.background_gradient?.from}
        gradientTo={promoBannerData?.background_gradient?.to}
      >
        <div className="flex flex-col items-center">
          {/* Gradient Icon */}
          <div className="relative">
            <GradientWrapper {...gradientProps} />
            <div className="absolute inset-0">
              <ClientGradientSwitcher {...gradientProps} />
            </div>
            {/* Santa Hat for Holiday Theme */}
            {CURRENT_PROMO_THEME === "holiday" && promoBannerData && (
              <div className="absolute -top-12 left-1/2 -translate-x-[35%] w-44 h-32 z-20 overflow-visible">
                <svg
                  viewBox="150 200 550 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ overflow: "visible" }}
                >
                  {/* Hat outline/shadow */}
                  <path d="M203.088,436.81c0,0,121.289-218.016,234.086-213.367c52.271,2.155,80.667,54.58,189.018,187.39c23.68,29.025-73.957,0.844-99.832-13.711c0,0,29.678,71.323,17.55,81.504C521.256,497.642,188.534,470.771,203.088,436.81z" />
                  {/* Main red hat body */}
                  <path
                    fill="#FF0000"
                    d="M214.989,431.339c0,0,117.473-205.47,219.314-200.9c52.262,2.345,64.324,43.946,183.472,178.285c24.855,28.025-78.717-9.817-104.593-24.371c0,0,33.153,80.05,21.025,90.231C511.553,493.6,200.434,465.299,214.989,431.339z"
                  />
                  {/* Hat shading */}
                  <path d="M533.792,394.077c-23.439-14.475-31.93-28.12-58.411-67.336c0,0,39.928,64.925,46.647,80.675c6.72,15.75-3.59-15.027,0.655-15.027S536.182,395.552,533.792,394.077z" />
                  <path
                    fill="#BA0808"
                    d="M475.381,326.74c0,0,89.802,82.597,124.642,83.022c0,0-3.117,4.079-3.667,5.668c-0.417,1.205-47.293-3.131-79.019-31.988C504.21,371.502,484.852,340.772,475.381,326.74z"
                  />
                  <path d="M460.028,332.805c0,0,24.459,12.937,54.497,60.486C525.396,410.499,497.02,347.764,460.028,332.805z" />
                  {/* White fur trim */}
                  <path d="M556.344,493.337c-0.495-6.746-0.266-11.763-17.707-26.07c-18.356-9.955-32.218-13.512-43.255-14.848c-3.575-0.434,18.395-3.008,15.385-3.985c-48.516-15.768-95.818-12.332-95.818-12.332l17.284-10.511c-28.604-7.885-89.09-6.377-115.904-2.459l19.429-9.216c-38.666-1.87-84.902,3.968-107.871,15.085c-2.298,1.113,1.069-6.262,1.069-6.262l-16.761,4.67c-18.54,6.636-26.521,14.498-27.281,33.827l-0.266,30.723c-0.547,9.507,11.494,17.166,27.468,13.458c0,0,38.529-8.045,155.166,0.17c110.185,7.761,149.423,34.535,149.423,34.535c18.271,8.081,28.894-1.364,35.337-19.125L556.344,493.337z" />
                  <path
                    fill="#FFFFFF"
                    d="M528.875,536.977c-2.731,0-5.852-0.742-9.28-2.21c-2.893-1.851-11.365-8.533-40.852-16.815c-2.076-0.583,6.857-1.092,6.857-1.092c-17.284-2.426-53.776-10.246-77.602-13.34c-5.678-0.736,14.43-2.911,8.247-3.54c-7.153-0.728-40.685,0.111-48.537-0.442c-31.446-2.215-80.92,0.038-99.922-9.867c-2.489-1.299,9.185,6.156,6.465,6.156c-24.087,0-40.298,0.677-50.245,1.937c-9.512,1.206-13.959-3.055-13.428-2.129c2.351,4.093,0.586,3.785,0.298,3.846l-0.132,0.029c-2.276,0.528-4.515,0.796-6.654,0.796c-4.98,0-9.374-1.504-11.753-4.024c-1.165-1.234-1.715-2.57-1.634-3.974l0.01-0.297l0.264-30.629c0.62-15.518,8.887-24.977,30.719-31.243l-3.841,7.378c23.752-10.107,37.347-19.779,95.009-19.811c-0.869,1.197-13.039,11.432-13.039,11.432s49.021-6.378,118.219,0.293c-0.345,0.98-10.979,8.693-10.979,8.693s27.088,1.414,30.727,1.414c18.132,0,40.48,4.552,55.287,9.047c-5.862,0.758-8.545,3.736-8.667,4.067c0,0,7.456,1.579,11.333,2.54c13.608,3.373,54.946,16.387,54.501,37.883l-4.103,26.396c-6.491,17.443-14.537,17.506-17.238,17.506C528.894,536.977,528.884,536.977,528.875,536.977z"
                  />
                  <path
                    fill="#E5E5E5"
                    d="M542.38,527.54c-5.555,9.388-11.281,9.437-13.476,9.437h-0.037c-2.729,0-5.845-0.752-9.277-2.22c-2.888-1.843-11.365-8.525-40.85-16.809c-2.074-0.583,6.865-1.092,6.865-1.092c-17.296-2.426-53.779-10.249-77.613-13.342c-5.676-0.74,14.434-2.912,8.248-3.542c-7.156-0.728-40.68,0.109-48.528-0.437c-31.45-2.22-80.923,0.036-99.929-9.873c-2.486-1.298,9.182,6.162,6.465,6.162c-24.088,0-40.292,0.679-50.238,1.94c-9.521,1.201-13.96-3.056-13.438-2.134c2.352,4.087,0.594,3.784,0.303,3.845l-0.134,0.036c-2.28,0.521-4.512,0.788-6.646,0.788c-4.985,0-9.376-1.503-11.753-4.026c-1.176-1.226-1.722-2.571-1.637-3.967l0.012-0.303l0.255-30.625c0.437-10.71,4.499-18.521,14.143-24.404c-3.026,2.767-10.606,9.034-9.595,20.151l0.379,24.713l0,0c0.48,3.79,2.412,6.049,3.714,7.126c3.942,3.259,9.092,2.444,14.077,2.444c2.134,0,4.378-0.267,6.646-0.788l0.134-0.036c0.291-0.061,2.049,0.242-0.291-3.845c-0.534-0.922,3.917,3.335,13.427,2.134c9.945-1.261,26.149-1.939,50.238-1.939c2.729,0-8.951-7.46-6.465-6.162c19.006,9.909,68.479,7.653,99.929,9.873c7.847,0.546,44.637,3.15,51.793,3.878c6.174,0.63-11.942,4.718-6.267,5.458c23.833,3.093,57.562,7.328,74.845,9.754c0,0-9.502,1.843-7.429,2.426c29.498,8.284,36.048,11.863,38.947,13.706c3.42,1.468,6.537,2.22,9.278,2.22c0,0,0.013,0,0.024,0C539.335,528.086,540.705,528.086,542.38,527.54z"
                  />
                  {/* Pompom */}
                  <path d="M605.095,470.902c-5.431-4.046-36.53-20.999-24.974-55.587c3.386-10.132,13.794-22.931,20.729-28.708c0.821-0.684-5.086,14.443-0.303,10.613c15.538-12.441,39.81-23.444,55.914-19.135c1.367,0.365-11.646,7.652-10.29,8.143c1.887,0.684,26.38,8.642,35.988,29.462c0,0-5.607-4.122-8.688,0.633c-1.833,2.83,6.723,11.623,2.112,34.466c-2.233,11.067-12.674,28.604-23.56,30.354c0,0,0.815-9.578-1.444-8.624c-26.237,11.081-51.548,7.984-53.772,4.549C596.574,476.708,608.104,473.147,605.095,470.902z" />
                  <path
                    fill="#FFFFFF"
                    d="M608.822,474.511c1.157,0.009,3.928-1.543,2.063-3.746c-2.355-2.785-36.885-17.396-24.813-53.705c1.679-5.053,8.041-16.109,7.688-13.904c-0.38,2.38,0.308,9.543,4.334,4.48c9.447-11.881,31.036-24.835,44.784-24.465c0.031,0.349-4.611,2.905-3.173,5.335c1.016,1.72,22.305,4.403,37.19,22.769c-4.756-2.631-8.386,1.096-8.268,2.578c0.654,8.168,6.186,15.753,2.858,32.772c-1.774,9.07-7.771,21.953-13.181,25.268c-0.985-1.39,0.256-6.953-4.077-10.876c-0.884-0.799-0.013,1.927-4.843,5.596C631.506,480.192,609.646,475.228,608.822,474.511z"
                  />
                  <path
                    fill="#E5E5E5"
                    d="M672.589,437.448c-0.045,2.924-0.372,6.208-1.128,9.938c-1.849,9.047-7.934,21.897-13.366,25.168c-0.973-1.401-1.251-7.848-3.069-10.749c-0.253-0.404-0.952,1.77-5.817,5.396c-17.977,13.455-39.798,8.336-40.615,7.615c1.151,0.008,3.939-1.524,2.087-3.733c-2.212-2.66-33.201-16.129-25.995-48.304c0.181,25.242,25.101,36.229,27.073,38.608c1.852,2.209-0.927,3.741-2.09,3.731c0.821,0.724,22.651,5.841,40.627-7.613c4.854-3.627,3.983-6.344,4.879-5.557c2.53,2.225,4.097,9.3,3.999,10.91c5.433-3.273,11.528-16.122,13.366-25.17C672.551,437.606,672.576,437.521,672.589,437.448z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        <PageHeader className="mb-0">
          {/* Promo Badge - show at top if promo active */}
          {promoBannerData && (
            <div className="mb-4 flex flex-col items-center gap-2">
              {/* Promo Title Text */}
              <div
                className={`text-sm font-bold uppercase tracking-[0.2em] ${promoTheme.textColor}`}
              >
                {promoTheme.emoji} {promoTheme.title}
              </div>
              {/* Promo Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${promoBannerData.background_gradient?.from || "#DC2626"} 0%, ${promoBannerData.background_gradient?.to || "#F43F5E"} 100%)`
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-white"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {promoBannerData.badge_text} for 3 months
                </span>
              </div>
            </div>
          )}

          <Link href="/blog/network-upgrade-black-friday">
            <Announcement>
              <AnnouncementTag className="hidden sm:block">
                Latest Update
              </AnnouncementTag>
              <AnnouncementTitle>
                <span className="sm:hidden">🆕</span>
                <span className="hidden sm:inline">🚀</span>
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
              className="text-4xl sm:text-5xl md:text-6xl"
            />
            <div className="mt-4 text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-normal tracking-tight">
              {t.raw("site.subheading").split("{flipwords}")[0]}
              <FlipWords
                words={t.raw("site.flipwords")}
                className="text-2xl sm:text-3xl md:text-4xl text-primary font-semibold tracking-tight"
              />
              {t.raw("site.subheading").split("{flipwords}")[1]}
            </div>
          </PageHeaderHeading>

          <PageHeaderDescription>{t("site.description")}</PageHeaderDescription>

          {/* Promo Code Display - show if promo active */}
          {promoBannerData && (
            <div className="flex items-center justify-center gap-3 mb-4">
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
          )}

          <PageActions>
            <Link href="/apps" className={cn(buttonVariants())}>
              {t("site.buttons.browse_apps")}
            </Link>

            <Link
              target="_blank"
              rel="noreferrer"
              href={siteConfig.links.github.url}
              title={siteConfig.links.github.label}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              <Icons.gitHub className="mr-2 size-4" />
              {siteConfig.links.github.label}
            </Link>
          </PageActions>
        </PageHeader>
      </PromoHeroWrapper>

      {/* Background vortex/snow effect - outside of PromoHeroWrapper */}
      <div className="fixed -top-40 left-0 -z-10 w-full h-[calc(100vh+10rem)] overflow-hidden pointer-events-none">
        <ClientVortexWrapper
          mode={CURRENT_PROMO_THEME === "holiday" ? "snow" : "default"}
          backgroundColor="transparent"
          className="flex size-full"
          rangeY={300}
          baseRadius={CURRENT_PROMO_THEME === "holiday" ? 2 : 1.5}
          particleCount={CURRENT_PROMO_THEME === "holiday" ? 80 : 20}
          rangeSpeed={CURRENT_PROMO_THEME === "holiday" ? 0.5 : 0.8}
          baseSpeed={CURRENT_PROMO_THEME === "holiday" ? 0.4 : undefined}
        />
      </div>

      <section id="plans-section" className="scroll-mt-4 pt-4">
        <Plans
          data={plansData.data}
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
              excluded_app_categories: t("plans.card.excluded_app_categories")
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
