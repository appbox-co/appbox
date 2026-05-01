import { getTranslations } from "next-intl/server"
import Image from "next/image"
import networkCloseupImage from "@/assets/server-imgs/network-closeup.jpg"
import rackFrontImage from "@/assets/server-imgs/rack-front.jpeg"
import rackNetworkImage from "@/assets/server-imgs/rack-network.jpg"

const serverImages = [
  {
    altKey: "rack_front",
    src: rackFrontImage,
    className: "left-0 top-10 rotate-[-5deg] z-10 h-72 w-52 sm:h-80 sm:w-60"
  },
  {
    altKey: "rack_network",
    src: rackNetworkImage,
    className: "left-24 top-0 rotate-[3deg] z-20 h-80 w-56 sm:left-32 sm:h-96 sm:w-72"
  },
  {
    altKey: "network_closeup",
    src: networkCloseupImage,
    className:
      "bottom-6 right-0 z-30 h-44 w-64 rotate-[-2deg] sm:h-52 sm:w-80"
  }
]

const benefits = [
  "no_rented_black_box",
  "network_control",
  "custom_ocp_hardware",
  "clear_data_locality",
  "better_cost_discipline",
  "built_for_appbox"
]

export async function SovereignCloudSection() {
  const t = await getTranslations("site.sovereign_cloud")

  return (
    <section className="py-20 sm:py-28">
      <div>
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

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-2xl shadow-blue-100/70 dark:border-white/10 dark:bg-[#05060d] dark:shadow-indigo-950/20 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(239,246,255,0.45)_48%,rgba(255,255,255,0.72))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70 dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] dark:opacity-30" />

            <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium uppercase tracking-widest text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200">
                  {t("eyebrow")}
                </div>
                <h3 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {t("card_title")}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-white/60 sm:text-base">
                  {t("card_description")}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefitKey) => (
                    <div
                      key={benefitKey}
                      className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/4 dark:shadow-none"
                    >
                      <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                        {t(`benefits.${benefitKey}.title`)}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                        {t(`benefits.${benefitKey}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-1 min-h-[460px] lg:order-2">
                <div className="relative mx-auto h-[460px] max-w-xl">
                  <div className="pointer-events-none absolute inset-8 rounded-full bg-blue-500/10 blur-3xl dark:bg-indigo-500/20" />
                  {serverImages.map((image) => (
                    <div
                      key={image.altKey}
                      className={`absolute overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5 backdrop-blur transition-transform duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/8 dark:shadow-black/40 dark:ring-white/10 ${image.className}`}
                    >
                      <Image
                        src={image.src}
                        alt={t(`images.${image.altKey}`)}
                        fill
                        sizes="(min-width: 1024px) 320px, 70vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
