"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import {
  attachAttributionToBillingLinks,
  persistAttributionParams
} from "@/lib/marketing-attribution"
import { captureBeginCheckoutEvent } from "@/lib/posthog"
import {
  allowRedditTracking,
  allowRedditTrackingWithoutPreference,
  trackRedditPageVisit
} from "@/lib/reddit-pixel"

// Cloudflare proxy domain for PostHog
const POSTHOG_PROXY_HOST = "piggy.appbox.co"
const IUBENDA_MEASUREMENT_PURPOSE = "4"

type IubendaPreferences = {
  consent?: boolean
  purposes?: Record<string, boolean>
}

type WindowWithIubenda = Window & {
  __appboxRedditAdvertisingConsentGranted?: boolean
  appboxAllowRedditTracking?: () => void
  _iub?: {
    cs?: {
      api?: {
        getPreferences?: () => IubendaPreferences | undefined
      }
    }
  }
}

const hasMeasurementConsent = () => {
  const preferences = (
    window as WindowWithIubenda
  )._iub?.cs?.api?.getPreferences?.()

  return (
    preferences?.consent === true ||
    preferences?.purposes?.[IUBENDA_MEASUREMENT_PURPOSE] === true
  )
}

const syncPostHogConsent = () => {
  if (hasMeasurementConsent()) {
    posthog.opt_in_capturing()
    return
  }

  posthog.opt_out_capturing()
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize PostHog
    if (typeof window !== "undefined") {
      posthog.init("phc_et9aGikely5Rh6zc3qA5tFyCAZNyX2CD4kGSalefCQJ", {
        api_host: `https://${POSTHOG_PROXY_HOST}`,
        ui_host: "https://eu.posthog.com", // EU region UI host
        capture_pageview: false, // We'll capture pageviews manually
        opt_out_capturing_by_default: true
      })
      posthog.register(persistAttributionParams())
      syncPostHogConsent()

      const trackingWindow = window as WindowWithIubenda
      trackingWindow.appboxAllowRedditTracking = allowRedditTracking
      if (trackingWindow.__appboxRedditAdvertisingConsentGranted) {
        allowRedditTracking()
      }

      const handleConsentGiven = () => {
        syncPostHogConsent()
        allowRedditTracking()
      }
      const optInPostHog = () => posthog.opt_in_capturing()
      const handlePreferenceNotNeeded = () => {
        optInPostHog()
        allowRedditTrackingWithoutPreference()
      }

      window.addEventListener("iubenda_consent_given", handleConsentGiven)
      window.addEventListener(
        "iubenda_consent_given_purpose_4",
        syncPostHogConsent
      )
      window.addEventListener(
        "iubenda_consent_given_purpose_5",
        allowRedditTracking
      )
      window.addEventListener(
        "iubenda_preference_not_needed",
        handlePreferenceNotNeeded
      )
      window.addEventListener("iubenda_consent_rejected", syncPostHogConsent)

      const consentPoll = window.setInterval(syncPostHogConsent, 1000)
      const redditPixelPoll = window.setInterval(trackRedditPageVisit, 1000)
      window.setTimeout(() => window.clearInterval(consentPoll), 30000)
      window.setTimeout(() => window.clearInterval(redditPixelPoll), 30000)

      return () => {
        window.removeEventListener("iubenda_consent_given", handleConsentGiven)
        window.removeEventListener(
          "iubenda_consent_given_purpose_4",
          syncPostHogConsent
        )
        window.removeEventListener(
          "iubenda_consent_given_purpose_5",
          allowRedditTracking
        )
        window.removeEventListener(
          "iubenda_preference_not_needed",
          handlePreferenceNotNeeded
        )
        window.removeEventListener(
          "iubenda_consent_rejected",
          syncPostHogConsent
        )
        window.clearInterval(consentPoll)
        window.clearInterval(redditPixelPoll)
        if (trackingWindow.appboxAllowRedditTracking === allowRedditTracking) {
          delete trackingWindow.appboxAllowRedditTracking
        }
      }
    }
  }, [])

  useEffect(() => {
    return attachAttributionToBillingLinks(captureBeginCheckoutEvent)
  }, [])

  useEffect(() => {
    if (pathname) {
      const attributionParams = persistAttributionParams(
        searchParams.toString()
      )
      posthog.register(attributionParams)

      syncPostHogConsent()
      trackRedditPageVisit()

      if (posthog.has_opted_out_capturing()) {
        return
      }

      // Track pageviews
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`
      }
      posthog.capture("$pageview", {
        $current_url: url,
        ...attributionParams
      })
    }
  }, [pathname, searchParams])

  return children
}
