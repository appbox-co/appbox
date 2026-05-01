import { getTranslations } from "next-intl/server"
import { CardLinkHint } from "@/components/ui/card-link-hint"
import { Link } from "@/i18n/routing"

const capabilities = ["chat", "filesystem", "browser", "tools"] as const

export async function OpenClawPromoSection() {
  const t = await getTranslations("site.openclaw_promo")

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[980px] text-center">
        <h2 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
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

      <div className="mx-auto mt-16 max-w-6xl">
        <Link
          href="/blog/openclaw-ai-assistant"
          className="group/card block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-2xl shadow-blue-100/70 transition-all duration-200 group-hover/card:-translate-y-0.5 group-hover/card:border-blue-300/80 group-hover/card:shadow-blue-200/80 group-focus-visible/card:-translate-y-0.5 group-focus-visible/card:border-blue-300/80 group-focus-visible/card:shadow-blue-200/80 dark:border-white/10 dark:bg-[#05060d] dark:shadow-indigo-950/20 dark:group-hover/card:border-primary/40 dark:group-hover/card:shadow-primary/20 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(239,246,255,0.45)_48%,rgba(255,255,255,0.72))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70 dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] dark:opacity-30" />

          <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium uppercase tracking-widest text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200">
                {t("eyebrow")}
              </div>

              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {t("card_title")}
                  </h3>
                  <CardLinkHint hoverScope="card" className="mt-2" />
                </div>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-white/60 sm:text-base">
                  {t("card_description")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {capabilities.map((key) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/4 dark:shadow-none"
                  >
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                      {t(`capabilities.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                      {t(`capabilities.${key}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-blue-50/50 shadow-inner shadow-blue-100/70 dark:border-white/10 dark:bg-black/30 dark:shadow-none">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.76),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />
              <div className="relative aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/blog-images/openclaw-dashboard-chat.png"
                  alt={t("image_alt")}
                  loading="lazy"
                  className="size-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
        </Link>
      </div>
    </section>
  )
}
