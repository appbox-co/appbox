"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import type { PinnedApp } from "@/api/pinned-apps/pinned-apps"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DisplayApp {
  id: number
  display_name: string
  icon_image: string
  domain: string
  isPinned: boolean
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

export interface AppIconStripProps {
  pinnedApps?: PinnedApp[]
  installedApps?: InstalledApp[]
  /** Tailwind size-* class for the icon squares */
  iconSize?: string
  stopPropagation?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

export function AppIconStrip({
  pinnedApps,
  installedApps,
  iconSize = "size-7",
  stopPropagation = false,
  className
}: AppIconStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Domain lookup so pinned apps (which lack a domain field) can show one too
  const domainMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const a of installedApps ?? []) map.set(a.id, a.domain ?? "")
    return map
  }, [installedApps])

  const displayApps = useMemo<DisplayApp[]>(() => {
    const pinnedIds = new Set((pinnedApps ?? []).map((p) => p.app_instance_id))

    const pinned: DisplayApp[] = (pinnedApps ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        id: p.app_instance_id,
        display_name: p.display_name,
        icon_image: p.icon_image,
        domain: domainMap.get(p.app_instance_id) ?? "",
        isPinned: true
      }))

    const others: DisplayApp[] = (installedApps ?? [])
      .filter((a) => !pinnedIds.has(a.id))
      .map((a) => ({
        id: a.id,
        display_name: a.display_name,
        icon_image: a.icon_image,
        domain: a.domain ?? "",
        isPinned: false
      }))

    return [...pinned, ...others]
  }, [pinnedApps, installedApps, domainMap])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      setCanScrollLeft(el.scrollLeft > 1)
      setCanScrollRight(el.scrollLeft < maxScroll - 1)
    }

    const timer = setTimeout(update, 50)
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    return () => {
      clearTimeout(timer)
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [displayApps])

  if (!displayApps.length) return null

  return (
    <TooltipProvider delayDuration={0} disableHoverableContent>
      {/*
       * `relative` wrapper for the fade overlays and chevron indicators.
       * The mask-image is intentionally NOT applied to the scroll container:
       * doing so creates a stacking context that breaks Radix tooltip portals.
       * Instead we use pointer-events-none gradient divs that match the card
       * background so clicks/hovers pass straight through to the icons below.
       */}
      <div className={cn("relative min-w-0 flex-1", className)}>
        {/* Scrollable icon row — no mask, events fully intact */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {displayApps.map((app) => (
            <Tooltip key={app.id}>
              {/*
               * Trigger wraps the icon div directly (not the Link) so the
               * hit area is an exact block square — no inline-<a> confusion.
               */}
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-80",
                    iconSize,
                    app.isPinned
                      ? "ring-2 ring-amber-400/60"
                      : "ring-1 ring-border/40"
                  )}
                >
                  <Link
                    href={ROUTES.INSTALLED_APP_DETAIL(app.id)}
                    className="block size-full"
                    onClick={
                      stopPropagation ? (e) => e.stopPropagation() : undefined
                    }
                  >
                    {app.icon_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${ICON_BASE_URL}${app.icon_image}`}
                        alt={app.display_name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {app.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {app.display_name}
                  {app.isPinned && (
                    <span className="ml-1 text-amber-400">★</span>
                  )}
                </p>
                {app.domain && (
                  <p className="text-xs text-muted-foreground">{app.domain}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Left gradient overlay + chevron */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-14 bg-linear-to-r from-card to-transparent transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={`scroll-indicator-arrow pointer-events-none ${canScrollLeft ? "visible pulsing" : ""}`}
          style={{ left: 0, right: "auto" }}
        >
          <ChevronLeft
            className="text-foreground/70"
            style={{ width: 16, height: 16 }}
          />
        </div>

        {/* Right gradient overlay + chevron */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-14 bg-linear-to-l from-card to-transparent transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={`scroll-indicator-arrow pointer-events-none ${canScrollRight ? "visible pulsing" : ""}`}
          style={{ right: 0 }}
        >
          <ChevronRight
            className="text-foreground/70"
            style={{ width: 16, height: 16 }}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
