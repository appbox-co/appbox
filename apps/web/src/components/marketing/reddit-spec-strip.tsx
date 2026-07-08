"use client"

import { useEffect, useState } from "react"
import {
  GaugeIcon,
  GlobeIcon,
  HardDriveIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
  ServerCogIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

type RedditSpec = {
  label: string
  value: string
}

interface RedditSpecStripProps {
  specs: RedditSpec[]
}

const icons = [
  HardDriveIcon,
  GaugeIcon,
  ServerCogIcon,
  RefreshCwIcon,
  GlobeIcon,
  MousePointerClickIcon
]

export function RedditSpecStrip({ specs }: RedditSpecStripProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (specs.length <= 1) return

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % specs.length)
    }, 2200)

    return () => window.clearInterval(interval)
  }, [specs.length])

  return (
    <section className="-mt-4 pb-12 sm:-mt-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-2 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-[#070912]/85 dark:shadow-black/30">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-indigo-500/10 via-sky-500/5 to-purple-500/10" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/70 to-transparent" />

        <div className="relative grid divide-y divide-slate-200/70 overflow-hidden rounded-[1.5rem] border border-white/70 bg-background/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/3 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6">
          {specs.map((spec, index) => {
            const Icon = icons[index] ?? ServerCogIcon
            const isActive = index === activeIndex

            return (
              <div
                key={spec.label}
                className={cn(
                  "group relative min-h-32 overflow-hidden p-4 transition-colors duration-500 hover:bg-white/75 dark:hover:bg-white/5 sm:p-5",
                  isActive && "bg-white/90 dark:bg-white/8"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-500/18 via-sky-500/8 to-purple-500/14 opacity-0 transition-opacity duration-500",
                    isActive && "opacity-100"
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500",
                    isActive && "opacity-100"
                  )}
                />

                <div className="relative mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary transition-all duration-500 group-hover:scale-105",
                      isActive &&
                        "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <span
                    className={cn(
                      "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/80 transition-colors duration-500",
                      isActive && "text-primary"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="relative text-sm font-semibold leading-tight sm:text-base">
                  {spec.label}
                </p>
                <p className="relative mt-2 text-sm leading-5 text-muted-foreground">
                  {spec.value}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
