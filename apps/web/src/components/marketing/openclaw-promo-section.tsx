import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/routing"

const capabilities = ["chat", "filesystem", "browser", "tools"] as const

export async function OpenClawPromoSection() {
  const t = await getTranslations("site.openclaw_promo")

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[980px] text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t("eyebrow")}
        </p>

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

      {/* Hero image — full-width dark card like an Apple product shot */}
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="overflow-hidden rounded-3xl bg-[#0d0d0f] shadow-2xl">
          <div className="aspect-video overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blog-images/openclaw-dashboard-chat.png"
              alt={t("image_alt")}
              loading="lazy"
              className="size-full object-cover object-top"
              style={{
                maskImage: "linear-gradient(to bottom, black 80%, transparent)"
              }}
            />
          </div>
        </div>
      </div>

      {/* Capability grid */}
      <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
        {capabilities.map((key) => (
          <div key={key} className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <CapabilityIcon which={key} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(`capabilities.${key}.title`)}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t(`capabilities.${key}.description`)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/blog/openclaw-ai-assistant"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {t("cta")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

function CapabilityIcon({ which }: { which: (typeof capabilities)[number] }) {
  const cls = "size-5 text-indigo-500"

  switch (which) {
    case "chat":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case "filesystem":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    case "browser":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    case "tools":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
  }
}
