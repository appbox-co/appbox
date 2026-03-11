import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/routing"

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

        {/* Hero: webtop - full width landscape showcase */}
        <div className="mx-auto mt-16 max-w-5xl text-left">
          <div className="aspect-video overflow-hidden rounded-2xl bg-[#100f15] ring-1 ring-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blog-images/day3-vps-webtop.png"
              alt={t("features.webtop.title")}
              loading="lazy"
              className="size-full object-cover object-top-left"
            />
          </div>
          <div className="mt-5 px-1">
            <h3 className="text-base font-semibold leading-snug">
              <span className="text-foreground">
                {t("features.webtop.title")}
              </span>
              <span className="font-normal text-muted-foreground">
                {" "}
                {t("features.webtop.description")}
              </span>
            </h3>
          </div>
        </div>

        {/* Two cards: console + distros */}
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Console */}
          <div className="group text-left">
            <div className="aspect-3/4 overflow-hidden rounded-2xl bg-[#100f15] ring-1 ring-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/blog-images/day3-vps-console.png"
                alt={t("features.console.title")}
                loading="lazy"
                style={{
                  transformOrigin: "left top",
                  objectPosition: "left 15%",
                  transform: "scale(1.9)"
                }}
                className="size-full object-cover transition-transform duration-500"
              />
            </div>
            <div className="mt-5 px-1">
              <h3 className="text-base font-semibold leading-snug">
                <span className="text-foreground">
                  {t("features.console.title")}
                </span>
                <span className="font-normal text-muted-foreground">
                  {" "}
                  {t("features.console.description")}
                </span>
              </h3>
            </div>
          </div>

          {/* Distros */}
          <div className="group text-left">
            <div className="aspect-3/4 overflow-hidden rounded-2xl bg-[#100f15] ring-1 ring-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/blog-images/day3-vps-store.png"
                alt={t("features.distros.title")}
                loading="lazy"
                style={{
                  transformOrigin: "left top",
                  objectPosition: "left top",
                  transform: "translate(0%, 0%) scale(1.8)"
                }}
                className="size-full object-cover transition-transform duration-500"
              />
            </div>
            <div className="mt-5 px-1">
              <h3 className="text-base font-semibold leading-snug">
                <span className="text-foreground">
                  {t("features.distros.title")}
                </span>
                <span className="font-normal text-muted-foreground">
                  {" "}
                  {t("features.distros.description")}
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/blog/launch-week-day-3-vps"
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
