"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"

// Cloudflare proxy domain for PostHog
const POSTHOG_PROXY_HOST = "piggy.appbox.co"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize PostHog
    if (typeof window !== "undefined") {
      posthog.init("phc_et9aGikely5Rh6zc3qA5tFyCAZNyX2CD4kGSalefCQJ", {
        api_host: `https://${POSTHOG_PROXY_HOST}`,
        ui_host: "https://eu.posthog.com", // EU region UI host
        capture_pageview: false // We'll capture pageviews manually
      })
    }
  }, [])

  useEffect(() => {
    if (pathname) {
      // Track pageviews
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`
      }
      posthog.capture("$pageview", {
        $current_url: url
      })
    }
  }, [pathname, searchParams])

  return children
}
