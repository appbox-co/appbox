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
import { siteConfig } from "@/config/site"
import { Link } from "@/i18n/routing"
import { getPlans } from "@/lib/appbox/api/getPlans"
import { cn } from "@/lib/utils"

export default async function IndexPage() {
  const t = await getTranslations()
  const plansData = await getPlans()

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
      <div className="flex flex-col items-center">
        {/* Static gradient shows during SSR, then client component takes over */}
        <div className="relative">
          {/* Server rendered static version */}
          <GradientWrapper {...gradientProps} />

          {/* Client-side animated version (will show after hydration) */}
          <div className="absolute inset-0">
            <ClientGradientSwitcher {...gradientProps} />
          </div>
        </div>
      </div>
      <PageHeader className="mb-10">
        <Link href="/blog/massive-updates">
          <Announcement>
            <AnnouncementTag>Latest Update</AnnouncementTag>
            <AnnouncementTitle>
              🚀 {t("site.announcement")}
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

        <div className="fixed -top-40 left-0 -z-10 size-full overflow-hidden">
          <ClientVortexWrapper
            backgroundColor="transparent"
            className="flex size-full"
            rangeY={300}
            baseRadius={1.5}
            particleCount={20}
            rangeSpeed={0.8}
          />
        </div>
      </PageHeader>

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
