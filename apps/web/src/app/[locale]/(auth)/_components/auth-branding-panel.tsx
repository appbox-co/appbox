"use client"

import { useTranslations } from "next-intl"
import {
  Cloud,
  Code,
  Database,
  FileText,
  Gamepad2,
  Globe,
  HardDrive,
  Music,
  Rocket,
  Server,
  Shield,
  Zap
} from "lucide-react"
import { Icons } from "@/components/shared/icons"

const stats = [
  { icon: Rocket, labelKey: "apps_count" },
  { icon: Zap, labelKey: "one_click" },
  { icon: Globe, labelKey: "network_speed" },
  { icon: Shield, labelKey: "always_secure" }
] as const

const appCategories = [
  { icon: Cloud, labelKey: "cloud" },
  { icon: FileText, labelKey: "cms" },
  { icon: Database, labelKey: "databases" },
  { icon: Music, labelKey: "music" },
  { icon: HardDrive, labelKey: "storage" },
  { icon: Gamepad2, labelKey: "gaming" },
  { icon: Code, labelKey: "development" },
  { icon: Server, labelKey: "virtual_servers" }
] as const

export function AuthBrandingPanel() {
  const t = useTranslations("auth.branding")

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#0c1220] via-[#111a2e] to-[#0a1628] p-12 text-white">
      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Gradient accent glow */}
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Logo */}
        <Icons.emblem className="mb-8 h-16 w-16 text-white/90 [&_g]:text-white/90!" />

        {/* Tagline */}
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">
          {t("tagline")}
        </h2>
        <p className="mb-10 text-sm text-white/60">{t("subtitle")}</p>

        {/* Stats grid */}
        <div className="mb-12 grid w-full grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.labelKey}
              className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/3 px-4 py-3"
            >
              <stat.icon className="h-5 w-5 shrink-0 text-indigo-400" />
              <span className="text-sm font-medium text-white/80">
                {t(stat.labelKey)}
              </span>
            </div>
          ))}
        </div>

        {/* App category icons */}
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/40">
          {t("categories_label")}
        </p>
        <div className="grid grid-cols-4 gap-3">
          {appCategories.map((cat) => (
            <div
              key={cat.labelKey}
              className="group flex flex-col items-center gap-1.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/6 bg-white/3 transition-colors group-hover:border-white/10 group-hover:bg-white/6">
                <cat.icon className="h-4 w-4 text-white/50 transition-colors group-hover:text-white/70" />
              </div>
              <span className="text-[10px] text-white/40">
                {t(`category_${cat.labelKey}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
