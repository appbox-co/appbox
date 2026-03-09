import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/routing"

const features = [
  {
    key: "dashboard",
    image: "/blog-images/day1-dashboard-overview.png",
    position: "14% top",
    shiftY: "-8%"
  },
  {
    key: "appstore",
    image: "/blog-images/day1-app-store.png",
    position: "14% top",
    shiftY: "-10%"
  },
  {
    key: "security",
    image: "/blog-images/day1-2fa-security.png",
    origin: "6% 25%",
    position: "6% 8%",
    shiftX: "-58%"
  }
] as const

export async function DashboardPromoSection() {
  const t = await getTranslations("site.dashboard_promo")

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[980px] text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("headline_1")}
          <br />
          <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {t("headline_2")}
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("description")}
        </p>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {features.map((feat) => (
            <div key={feat.key} className="group text-left">
              <div className="aspect-3/4 overflow-hidden rounded-2xl ring-1 ring-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={feat.image}
                  alt={t(`features.${feat.key}.title`)}
                  loading="lazy"
                  style={{
                    transformOrigin:
                      "origin" in feat ? feat.origin : "top left",
                    objectPosition:
                      "position" in feat ? feat.position : "left top",
                    transform: `translate(${"shiftX" in feat ? feat.shiftX : "0%"}, ${"shiftY" in feat ? feat.shiftY : "0%"}) scale(1.5)`
                  }}
                  className="size-full object-cover transition-transform duration-500"
                />
              </div>
              <div className="mt-5 px-1">
                <h3 className="text-base font-semibold leading-snug">
                  <span className="text-foreground">
                    {t(`features.${feat.key}.title`)}
                  </span>
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    {t(`features.${feat.key}.description`)}
                  </span>
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/blog/launch-week-day-1-new-dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
          >
            {t("cta")}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
