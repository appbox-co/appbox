"use client"

import { useEffect, useState } from "react"
import { animate, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

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

export function LiveInstallCounter({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState("0")

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
      duration: 0.2,
      ease: "easeOut"
    })
    return controls.stop
  }, [count, motionValue])

  useEffect(() => {
    return motionValue.on("change", (v) => {
      setDisplay(Math.round(v).toLocaleString())
    })
  }, [motionValue])

  return (
    <div
      className={cn("flex items-center justify-center gap-2.5 py-4", className)}
    >
      <span className="size-0 shrink-0 border-x-[5px] border-b-8 border-x-transparent border-b-emerald-500" />
      <span className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
        {display}
      </span>
      <span className="text-lg sm:text-xl text-muted-foreground">
        apps installed and counting
      </span>
    </div>
  )
}
