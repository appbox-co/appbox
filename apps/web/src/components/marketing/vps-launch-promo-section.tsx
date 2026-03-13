import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/routing"

const cards = [
  {
    key: "webtop",
    image: "/blog-images/day3-vps-webtop.png",
    imagePosition: "object-top-left"
  },
  {
    key: "console",
    image: "/blog-images/day3-vps-console.png",
    imageStyle: {
      transformOrigin: "left top",
      objectPosition: "left 15%",
      transform: "scale(1.6)"
    }
  },
  {
    key: "distros",
    image: "/blog-images/day3-vps-store.png",
    imageStyle: {
      transformOrigin: "left top",
      objectPosition: "left top",
      transform: "scale(1.5)"
    }
  },
  {
    key: "windows",
    image: "/blog-images/day5-windows-appbox-data.png",
    imagePosition: "object-center"
  }
] as const

export async function VpsLaunchPromoSection() {
  const t = await getTranslations("site.vps_launch_promo")

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
      </div>

      {/* Apple-style scrollable card set */}
      <div className="relative mt-16">
        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 scrollbar-none sm:mx-auto sm:max-w-6xl sm:grid sm:grid-cols-4 sm:overflow-x-visible sm:px-0 sm:pb-0">
          {cards.map((card) => (
            <div
              key={card.key}
              className="w-[72vw] shrink-0 snap-center sm:w-auto"
            >
              <div className="overflow-hidden rounded-3xl bg-muted/50 ring-1 ring-border/40">
                <div className="aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={t(`features.${card.key}.title`)}
                    loading="lazy"
                    style={"imageStyle" in card ? card.imageStyle : undefined}
                    className={`size-full object-cover ${"imagePosition" in card ? card.imagePosition : ""}`}
                  />
                </div>
              </div>
              <div className="mt-4 px-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t(`features.${card.key}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`features.${card.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {t("cta")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
