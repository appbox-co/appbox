"use client"

const IUBENDA_ADVERTISING_PURPOSE = "5"

type IubendaPreferences = {
  consent?: boolean
  purposes?: Record<string, boolean>
}

type RedditPixelFunction = (
  command: "init" | "track",
  eventNameOrPixelId: string,
  metadata?: Record<string, unknown>
) => void

type WindowWithTracking = Window & {
  __appboxRedditLastPageVisit?: string
  __appboxRedditAdvertisingConsentNotNeeded?: boolean
  _iub?: {
    cs?: {
      api?: {
        getPreferences?: () => IubendaPreferences | undefined
      }
    }
  }
  rdt?: RedditPixelFunction
}

function hasAdvertisingConsent() {
  if (typeof window === "undefined") return false

  const trackingWindow = window as WindowWithTracking
  if (trackingWindow.__appboxRedditAdvertisingConsentNotNeeded) return true

  const preferences = trackingWindow._iub?.cs?.api?.getPreferences?.()

  return (
    preferences?.consent === true ||
    preferences?.purposes?.[IUBENDA_ADVERTISING_PURPOSE] === true
  )
}

export function allowRedditTrackingWithoutPreference() {
  if (typeof window === "undefined") return

  ;(window as WindowWithTracking).__appboxRedditAdvertisingConsentNotNeeded =
    true
  trackRedditPageVisit()
}

export function trackRedditPageVisit() {
  if (typeof window === "undefined" || !hasAdvertisingConsent()) return

  const trackingWindow = window as WindowWithTracking
  if (typeof trackingWindow.rdt !== "function") return

  const currentUrl = window.location.href
  if (trackingWindow.__appboxRedditLastPageVisit === currentUrl) return

  trackingWindow.rdt("track", "PageVisit")
  trackingWindow.__appboxRedditLastPageVisit = currentUrl
}
