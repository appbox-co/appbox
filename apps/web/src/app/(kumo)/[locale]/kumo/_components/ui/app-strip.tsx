"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button, Tooltip, TooltipProvider } from "@cloudflare/kumo"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import type { PinnedApp } from "@/api/pinned-apps/pinned-apps"
import { Link } from "@/i18n/routing"
import { kumoRoutes } from "../kumo-routes"
import { APP_ICON_BASE_URL } from "../shared"

export interface StripApp {
  id: number
  name: string
  icon: string
  domain: string
  pinned: boolean
}

/** Pinned apps first (in their saved order), then everything else installed. */
export function toStripApps(
  pinnedApps: PinnedApp[] = [],
  installedApps: InstalledApp[] = []
): StripApp[] {
  const domains = new Map(installedApps.map((app) => [app.id, app.domain]))

  // A pin can outlive the app it points at, so only keep pins that resolve.
  const pinned = pinnedApps
    .filter((pin) => domains.has(pin.app_instance_id))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pin) => ({
      id: pin.app_instance_id,
      name: pin.display_name,
      icon: pin.icon_image,
      domain: domains.get(pin.app_instance_id) ?? "",
      pinned: true
    }))
  const pinnedIds = new Set(pinned.map((app) => app.id))

  const others = installedApps
    .filter((app) => !pinnedIds.has(app.id))
    .map((app) => ({
      id: app.id,
      name: app.display_name,
      icon: app.icon_image,
      domain: app.domain ?? "",
      pinned: false
    }))

  return [...pinned, ...others]
}

interface AppStripProps {
  apps: StripApp[]
  /** Accessible name for the list, e.g. "Apps on media-box". */
  label: string
}

const COPY = {
  pinned: "Pinned",
  scrollBack: "Show earlier apps",
  scrollForward: "Show more apps"
} as const

/**
 * One-click shortcuts to every app on an Appbox. Scrolls sideways when the
 * icons do not fit; the edge fade comes from Kumo's `data-overflowing` styles.
 */
export function AppStrip({ apps, label }: AppStripProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const overflowing = edges.start || edges.end
  const count = apps.length

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const update = () => {
      const max = list.scrollWidth - list.clientWidth
      // scrollLeft is negative in right-to-left layouts.
      const position = Math.abs(list.scrollLeft)
      const next = { start: position > 1, end: position < max - 1 }
      setEdges((prev) =>
        prev.start === next.start && prev.end === next.end ? prev : next
      )
    }

    const observer = new ResizeObserver(update)
    observer.observe(list)
    list.addEventListener("scroll", update, { passive: true })
    return () => {
      observer.disconnect()
      list.removeEventListener("scroll", update)
    }
  }, [count])

  const scrollByPage = (direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const rtl = getComputedStyle(list).direction === "rtl" ? -1 : 1
    list.scrollBy({ left: direction * rtl * list.clientWidth * 0.8 })
  }

  if (count === 0) return null

  const firstUnpinned = apps.findIndex((app) => !app.pinned)

  return (
    <TooltipProvider delay={150}>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {overflowing && (
          <Button
            variant="ghost"
            size="xs"
            shape="square"
            icon={CaretLeftIcon}
            aria-label={COPY.scrollBack}
            disabled={!edges.start}
            onClick={() => scrollByPage(-1)}
          />
        )}

        {/* contain-inline-size stops a long strip from widening the table. */}
        <ul
          ref={listRef}
          aria-label={label}
          data-overflowing={overflowing ? "" : undefined}
          className="no-scrollbar -m-1 flex min-w-0 flex-1 list-none items-center gap-1.5 overflow-x-auto scroll-smooth p-1 contain-inline-size motion-reduce:scroll-auto"
        >
          {apps.map((app, index) => (
            <li key={app.id} className="flex shrink-0 items-center gap-1.5">
              {index === firstUnpinned && index > 0 && (
                <span
                  aria-hidden="true"
                  className="mx-0.5 h-4 w-px bg-kumo-line"
                />
              )}
              {/* Kumo's tooltip trigger resets the cursor, even on a link. */}
              <Tooltip
                side="top"
                content={
                  <span className="grid gap-0.5 text-left">
                    <span className="font-medium">{app.name}</span>
                    {app.domain && (
                      <span className="font-mono text-[0.9em] whitespace-nowrap text-kumo-subtle">
                        {app.domain}
                      </span>
                    )}
                    {app.pinned && (
                      <span className="text-kumo-subtle">{COPY.pinned}</span>
                    )}
                  </span>
                }
                render={
                  <Link
                    href={kumoRoutes.installedApp(app.id)}
                    aria-label={app.name}
                    className="flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-kumo-tint text-sm font-medium text-kumo-subtle no-underline ring ring-kumo-hairline outline-none hover:ring-2 hover:ring-kumo-brand focus-visible:ring-2 focus-visible:ring-kumo-brand"
                  />
                }
              >
                {app.icon ? (
                  <Image
                    src={`${APP_ICON_BASE_URL}${app.icon}`}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  app.name.charAt(0).toUpperCase()
                )}
              </Tooltip>
            </li>
          ))}
        </ul>

        {overflowing && (
          <Button
            variant="ghost"
            size="xs"
            shape="square"
            icon={CaretRightIcon}
            aria-label={COPY.scrollForward}
            disabled={!edges.end}
            onClick={() => scrollByPage(1)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
