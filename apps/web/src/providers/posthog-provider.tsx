"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import {
  attachAttributionToBillingLinks,
  ATTRIBUTION_PARAM_NAMES,
  persistAttributionParams
} from "@/lib/marketing-attribution"
import { captureBeginCheckoutEvent } from "@/lib/posthog"
import {
  allowRedditTracking,
  allowRedditTrackingWithoutPreference,
  trackRedditPageVisit
} from "@/lib/reddit-pixel"
import {
  allowMeasurementTracking,
  allowMeasurementTrackingWithoutPreference,
  allowsStatisticalAnalytics,
  hasAdvertisingConsent,
  hasMeasurementConsent
} from "@/lib/tracking-consent"

const POSTHOG_PROXY_HOST = "piggy.appbox.co"

type WindowWithTrackingBridge = Window & {
  __appboxRedditAdvertisingConsentGranted?: boolean
  appboxAllowRedditTracking?: () => void
}

function unregisterAttributionParams() {
  for (const name of ATTRIBUTION_PARAM_NAMES) {
    posthog.unregister(name)
  }
}

function syncPostHogAttribution(search = "") {
  if (hasAdvertisingConsent()) {
    posthog.register(
      persistAttributionParams(search, {
        allowStorage: true
      })
    )
    return
  }

  persistAttributionParams(search, {
    allowStorage: false
  })
  unregisterAttributionParams()
}

function referringDomain() {
  if (!document.referrer) return "$direct"

  try {
    return new URL(document.referrer).hostname
  } catch {
    return ""
  }
}

function pageviewUrl(includeQuery: boolean) {
  const url = new URL(window.location.href)
  if (!includeQuery) {
    url.search = ""
  }

  return url.toString()
}

function clearLegacyPostHogOptOutIfAllowed() {
  if (!allowsStatisticalAnalytics()) return

  try {
    if (posthog.has_opted_out_capturing()) {
      posthog.clear_opt_in_out_capturing()
    }
  } catch {
    // Historical consent state should not block aggregate pageview analytics.
  }
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
        capture_pageleave: false,
        autocapture: false,
        persistence: "memory",
        save_campaign_params: false,
        save_referrer: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        advanced_disable_decide: true,
        advanced_disable_feature_flags: true,
        person_profiles: "identified_only"
      })
      clearLegacyPostHogOptOutIfAllowed()
      syncPostHogAttribution()

      const trackingWindow = window as WindowWithTrackingBridge
      trackingWindow.appboxAllowRedditTracking = allowRedditTracking
      if (trackingWindow.__appboxRedditAdvertisingConsentGranted) {
        allowRedditTracking()
      }

      const handleConsentGiven = () => {
        allowMeasurementTracking()
        clearLegacyPostHogOptOutIfAllowed()
        syncPostHogAttribution()
        allowRedditTracking()
      }
      const handleMeasurementConsentGiven = () => {
        allowMeasurementTracking()
        clearLegacyPostHogOptOutIfAllowed()
        syncPostHogAttribution()
      }
      const handlePreferenceNotNeeded = () => {
        allowMeasurementTrackingWithoutPreference()
        clearLegacyPostHogOptOutIfAllowed()
        syncPostHogAttribution()
        allowRedditTrackingWithoutPreference()
      }
      const handleConsentRejected = () => {
        syncPostHogAttribution()
      }

      window.addEventListener("iubenda_consent_given", handleConsentGiven)
      window.addEventListener(
        "iubenda_consent_given_purpose_4",
        handleMeasurementConsentGiven
      )
      window.addEventListener(
        "iubenda_consent_given_purpose_5",
        allowRedditTracking
      )
      window.addEventListener(
        "iubenda_preference_not_needed",
        handlePreferenceNotNeeded
      )
      window.addEventListener("iubenda_consent_rejected", handleConsentRejected)

      const consentPoll = window.setInterval(syncPostHogAttribution, 1000)
      const redditPixelPoll = window.setInterval(trackRedditPageVisit, 1000)
      window.setTimeout(() => window.clearInterval(consentPoll), 30000)
      window.setTimeout(() => window.clearInterval(redditPixelPoll), 30000)

      return () => {
        window.removeEventListener("iubenda_consent_given", handleConsentGiven)
        window.removeEventListener(
          "iubenda_consent_given_purpose_4",
          handleMeasurementConsentGiven
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
          handleConsentRejected
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
    return attachAttributionToBillingLinks(
      captureBeginCheckoutEvent,
      hasAdvertisingConsent
    )
  }, [])

  useEffect(() => {
    if (pathname) {
      const includeAdvertisingAttribution = hasAdvertisingConsent()
      const attributionParams = includeAdvertisingAttribution
        ? persistAttributionParams(searchParams.toString(), {
            allowStorage: true
          })
        : persistAttributionParams(searchParams.toString(), {
            allowStorage: false
          })

      syncPostHogAttribution(searchParams.toString())
      trackRedditPageVisit()

      if (!allowsStatisticalAnalytics()) {
        return
      }

      clearLegacyPostHogOptOutIfAllowed()

      // Track pageviews
      posthog.capture("$pageview", {
        $current_url: pageviewUrl(includeAdvertisingAttribution),
        $host: window.location.host,
        $pathname: pathname,
        $referrer: document.referrer,
        $referring_domain: referringDomain(),
        appbox_analytics_mode: hasMeasurementConsent()
          ? "consented"
          : "statistical",
        ...(includeAdvertisingAttribution ? attributionParams : {})
      })
    }
  }, [pathname, searchParams])

  return children
}
