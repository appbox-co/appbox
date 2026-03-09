"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window.gtag === "function") {
      const url = pathname + searchParams.toString()
      window.gtag("config", "GT-T53F3CT6", {
        page_path: url
      })
      console.log(`Page view tracked: ${url}`) // Optional: for debugging
    }
  }, [pathname, searchParams])

  return null
}
