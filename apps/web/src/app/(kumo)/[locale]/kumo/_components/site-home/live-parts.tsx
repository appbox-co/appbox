"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@cloudflare/kumo"
import { AppIcon } from "../app-icon"
import type { CatalogueApp } from "./catalogue"
import { usePauseOffscreen } from "./scene"

async function fetchInstallCount(): Promise<number | null> {
  try {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"
    const response = await fetch(`https://api.${domain}/stats`)
    if (!response.ok) return null
    const data = await response.json()
    return typeof data.total_installs === "number" ? data.total_installs : null
  } catch {
    return null
  }
}

/** The live install total, polled like the current page's counter; hidden when it can't be read. */
export function InstallCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const result = await fetchInstallCount()
      if (!cancelled && result !== null) setCount(result)
    }
    void poll()
    const interval = window.setInterval(poll, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  if (count === null) return null
  return (
    <Badge variant="success" appearance="dot">
      <strong className="font-semibold tabular-nums">
        {count.toLocaleString("en-GB")}
      </strong>{" "}
      apps installed so far
    </Badge>
  )
}

/** Three lanes of catalogue apps drifting sideways, paused while off screen. */
export function AppsWall({ apps }: { apps: CatalogueApp[] }) {
  const wallRef = useRef<HTMLDivElement>(null)
  usePauseOffscreen(wallRef)

  const third = Math.ceil(apps.length / 3)
  const lanes = [
    apps.slice(0, third),
    apps.slice(third, third * 2),
    apps.slice(third * 2)
  ]

  return (
    <div ref={wallRef} className="ks-wall" aria-hidden="true">
      {lanes.map((lane, index) => (
        <div key={index} className="ks-lane">
          {[...lane, ...lane].map((app, position) => (
            <div key={`${app.name}-${position}`} className="ks-app">
              <AppIcon icon={app.icon} name={app.name} className="size-8" />
              <span>
                {app.name}
                <small>{app.category}</small>
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
