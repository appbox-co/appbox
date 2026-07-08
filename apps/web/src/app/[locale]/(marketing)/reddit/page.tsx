import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getAppDetails } from "@/api/appbox/app-details"
import { getPlans } from "@/api/appbox/plans"
import { AppConnectionsSection } from "@/components/marketing/app-connections-section"
import { AppsMarquee } from "@/components/marketing/apps-marquee"
import { RedditFeatureCardsSection } from "@/components/marketing/reddit-feature-cards-section"
import { RedditFAQSection } from "@/components/marketing/reddit-faq-section"
import { RedditHeroSection } from "@/components/marketing/reddit-hero-section"
import { RedditPlansSection } from "@/components/marketing/reddit-plans-section"
import { RedditSpecStrip } from "@/components/marketing/reddit-spec-strip"
import { SimpleInstallPromoSection } from "@/components/marketing/simple-install-promo-section"
import { siteConfig } from "@/config/site"
import { absoluteUrl } from "@/lib/utils"

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations("site.reddit_landing")

  const title = t("meta_title")
  const description = t("meta_description")

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true
    },
    alternates: {
      canonical: absoluteUrl(`/${params.locale}/reddit`)
    },
    openGraph: {
      type: "website",
      title,
      url: absoluteUrl(`/${params.locale}/reddit`),
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

export default async function RedditLandingPage() {
  const t = await getTranslations()
  const [plansData, nextcloudApp] = await Promise.all([
    getPlans(),
    getAppDetails("Nextcloud").catch(() => null)
  ])

  return (
    <div className="container relative">
      <RedditHeroSection
        app={nextcloudApp}
        headingPrefix={t("site.reddit_landing.hero.heading_prefix")}
        headingEmphasis={t("site.reddit_landing.hero.heading_emphasis")}
        subheadingPrefix={t("site.reddit_landing.hero.subheading_prefix")}
        flipwords={t.raw("site.reddit_landing.hero.flipwords") as string[]}
        subheadingSuffix={t("site.reddit_landing.hero.subheading_suffix")}
        description={t("site.reddit_landing.hero.description")}
        primaryCta={t("site.reddit_landing.cta.primary")}
        secondaryCta={t("site.reddit_landing.cta.secondary")}
      />

      <RedditSpecStrip specs={t.raw("site.reddit_landing.spec_strip")} />

      <SimpleInstallPromoSection plansData={plansData} />

      <RedditPlansSection
        plansData={plansData}
        eyebrow={t("site.reddit_landing.plans.eyebrow")}
        heading={t("site.reddit_landing.plans.heading")}
        description={t("site.reddit_landing.plans.description")}
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

      <RedditFeatureCardsSection
        headline1={t("site.reddit_landing.features_section.headline_1")}
        headline2={t("site.reddit_landing.features_section.headline_2")}
        description={t("site.reddit_landing.features_section.description")}
        cards={t.raw("site.reddit_landing.features_section.cards")}
      />

      <AppsMarquee
        headline1={t("site.reddit_landing.apps_section.headline_1")}
        headline2={t("site.reddit_landing.apps_section.headline_2")}
        description={t("site.reddit_landing.apps_section.description")}
      />

      <AppConnectionsSection
        headline1={t("site.reddit_landing.connections_section.headline_1")}
        headline2={t("site.reddit_landing.connections_section.headline_2")}
        description={t("site.reddit_landing.connections_section.description")}
      />

      <RedditFAQSection
        title={t("site.reddit_landing.faq_section.title")}
        description={t("site.reddit_landing.faq_section.description")}
        items={t.raw("site.reddit_landing.faq_section.items")}
      />
    </div>
  )
}
