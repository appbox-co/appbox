"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useMotionValue } from "framer-motion"

const DEV_FALLBACK = process.env.NODE_ENV === "development" ? 48_347 : null

async function fetchInstallCount(): Promise<number | null> {
  try {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"
    const res = await fetch(`https://api.${domain}/stats`)
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.total_installs === "number") return data.total_installs
  } catch {
    // Counter gracefully hides when endpoint is unavailable
  }
  return null
}

export function LiveInstallCounter() {
  const [count, setCount] = useState<number | null>(DEV_FALLBACK)
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState("0")
  const isFirstLoad = useRef(true)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const result = await fetchInstallCount()
      if (!cancelled && result !== null) setCount(result)
    }

    poll()
    const interval = setInterval(poll, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (count === null) return
    const controls = animate(motionValue, count, {
      duration: isFirstLoad.current ? 2 : 0.8,
      ease: "easeOut"
    })
    isFirstLoad.current = false
    return controls.stop
  }, [count, motionValue])

  useEffect(() => {
    return motionValue.on("change", (v) => {
      setDisplay(Math.round(v).toLocaleString())
    })
  }, [motionValue])

  if (count === null) return null

  return (
    <div className="flex items-center justify-center gap-2.5 py-4">
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
        {display}
      </span>
      <span className="text-lg sm:text-xl text-muted-foreground">
        apps installed and counting
      </span>
    </div>
  )
}
