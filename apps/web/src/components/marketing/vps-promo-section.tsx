import { getTranslations } from "next-intl/server"
import {
  ArrowRight,
  Monitor,
  MousePointerClick,
  Server,
  Terminal,
  Zap
} from "lucide-react"
import { Link } from "@/i18n/routing"

interface VpsPromoSectionProps {
  showLinux: boolean
  showWindows: boolean
}

const linuxFeatures = [
  { icon: Terminal, key: "f1" },
  { icon: Zap, key: "f2" },
  { icon: MousePointerClick, key: "f3" }
]

const windowsFeatures = [
  { icon: Monitor, key: "f1" },
  { icon: Server, key: "f2" },
  { icon: Zap, key: "f3" }
]

export async function VpsPromoSection({
  showLinux,
  showWindows
}: VpsPromoSectionProps) {
  const t = await getTranslations("site")
  const showBoth = showLinux && showWindows

  const headlineKey = showLinux ? "vps_promo" : "windows_vps_promo"
  const descriptionKey = showBoth
    ? "vps_promo.description_combined"
    : showLinux
      ? "vps_promo.description"
      : "windows_vps_promo.description"

  return (
    <section className="py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-[58rem] text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {t("vps_promo.badge")}
          </span>

          <h2 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t(`${headlineKey}.headline_1`)}
            <br />
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {t(`${headlineKey}.headline_2`)}
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t(descriptionKey)}
          </p>

          {showBoth ? (
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
              <FeatureGroup
                label={t("vps_promo.group_label")}
                groupIcon={Server}
                features={linuxFeatures}
                localePrefix="vps_promo"
                href="/apps?category=VPS"
                ctaLabel={t("vps_promo.cta")}
                t={t}
              />
              <FeatureGroup
                label={t("windows_vps_promo.group_label")}
                groupIcon={Monitor}
                features={windowsFeatures}
                localePrefix="windows_vps_promo"
                href="/apps?category=Windows"
                ctaLabel={t("windows_vps_promo.cta")}
                t={t}
              />
            </div>
          ) : (
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
              {(showLinux ? linuxFeatures : windowsFeatures).map((feat) => {
                const Icon = feat.icon
                const prefix = showLinux ? "vps_promo" : "windows_vps_promo"
                return (
                  <div
                    key={feat.key}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">
                      {t(`${prefix}.features.${feat.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`${prefix}.features.${feat.key}.description`)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {!showBoth && (
            <div className="mt-10">
              <Link
                href={
                  showLinux ? "/apps?category=VPS" : "/apps?category=Windows"
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                {t(showLinux ? "vps_promo.cta" : "windows_vps_promo.cta")}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FeatureGroup({
  label,
  groupIcon: GroupIcon,
  features,
  localePrefix,
  href,
  ctaLabel,
  t
}: {
  label: string
  groupIcon: typeof Server
  features: Array<{ icon: typeof Terminal; key: string }>
  localePrefix: string
  href: string
  ctaLabel: string
  t: (key: string) => string
}) {
  return (
    <div className="text-center">
      <div className="mb-8 inline-flex items-center gap-2">
        <GroupIcon className="size-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide">{label}</span>
      </div>
      <div className="space-y-6">
        {features.map((feat) => {
          const Icon = feat.icon
          return (
            <div key={feat.key} className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">
                {t(`${localePrefix}.features.${feat.key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`${localePrefix}.features.${feat.key}.description`)}
              </p>
            </div>
          )
        })}
      </div>
      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
