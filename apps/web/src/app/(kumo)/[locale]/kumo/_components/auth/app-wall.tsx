"use client"

import { createContext, useContext, type ReactNode } from "react"
import Image from "next/image"
import { cn } from "@cloudflare/kumo"
import { APP_ICON_BASE_URL } from "../shared"
import type { WallApp } from "./wall-apps"

const WallAppsContext = createContext<WallApp[]>([])

/** Hands the public catalogue to the signed-out pages. */
export function WallAppsProvider({
  apps,
  children
}: {
  apps: WallApp[]
  children: ReactNode
}) {
  return <WallAppsContext value={apps}>{children}</WallAppsContext>
}

export function useWallApps() {
  return useContext(WallAppsContext)
}

/**
 * Lays apps out so the same one never sits beside itself, repeating a short
 * catalogue as often as it takes to fill every slot.
 */
function spread(apps: WallApp[], lanes: number, perLane: number) {
  const usable = apps.filter((app) => app.icon)
  if (!usable.length) return []
  return Array.from({ length: lanes }, (_, lane) =>
    Array.from(
      { length: perLane },
      (_, slot) => usable[(slot * lanes + lane) % usable.length]!
    )
  )
}

/** Every seventh tile or so carries a green "running" dot. */
const isRunning = (lane: number, slot: number) => (slot + lane * 2) % 7 === 3

function Tile({
  app,
  running,
  small
}: {
  app: WallApp
  running: boolean
  small?: boolean
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center bg-kumo-base shadow-xs ring ring-kumo-line",
        small ? "size-12 rounded-xl" : "size-20 rounded-2xl"
      )}
    >
      <Image
        src={`${APP_ICON_BASE_URL}${app.icon}`}
        alt=""
        width={48}
        height={48}
        unoptimized
        className={cn(
          "object-cover",
          small ? "size-8 rounded-lg" : "size-12 rounded-xl"
        )}
      />
      {running && (
        <span
          className={cn(
            "absolute rounded-full bg-kumo-success ring-2 ring-kumo-base",
            small ? "top-1 right-1 size-1.5" : "top-2 right-2 size-2"
          )}
        />
      )}
    </div>
  )
}

/**
 * Columns of app icons drifting up and down, tilted, behind the sign-in
 * page's caption. Each column's list is doubled and moved by half its height,
 * so the loop has no seam. Still for anyone who asks for less motion.
 */
export function AppWall({ apps }: { apps: WallApp[] }) {
  // One copy of a lane must outlast the panel's height plus the overhang
  // above it, even on a tall screen: 24 tiles is about 2,300px.
  const lanes = spread(apps, 7, 24)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden mask-t-from-75%"
    >
      {/* Lanes hang from the top at their own height (items-start): a lane
          stretched to the box would move by more than one copy and jump. */}
      <div className="absolute -inset-x-1/3 -inset-y-1/4 flex -rotate-[8deg] items-start justify-center gap-4">
        {lanes.map((lane, index) => (
          <div
            key={index}
            className={cn(
              "kumo-wall-lane flex flex-col",
              index % 2 === 1 && "kumo-wall-lane-reverse"
            )}
            style={{ animationDuration: `${240 + (index % 3) * 40}s` }}
          >
            {[...lane, ...lane].map((app, slot) => (
              // Margins, not gaps: the doubled list must be exactly two periods tall.
              <div key={slot} className="pb-4">
                <Tile
                  app={app}
                  running={isRunning(index, slot % lane.length)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The phone-width stand-in for the wall: one row drifting sideways. */
export function AppStrip({ apps }: { apps: WallApp[] }) {
  const [row] = spread(apps, 1, 14)
  if (!row) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none overflow-hidden py-1 mask-x-from-85%"
    >
      <div className="kumo-wall-row flex w-max">
        {[...row, ...row].map((app, slot) => (
          <div key={slot} className="pr-3">
            <Tile app={app} running={isRunning(0, slot % row.length)} small />
          </div>
        ))}
      </div>
    </div>
  )
}
