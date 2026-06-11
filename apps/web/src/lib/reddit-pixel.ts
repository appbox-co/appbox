"use client"

const IUBENDA_ADVERTISING_PURPOSE = "5"
const REDDIT_PIXEL_ID = "a2_hofzgodvh6np"
const REDDIT_PIXEL_SCRIPT_ID = "appbox-reddit-pixel-js"
const REDDIT_PIXEL_SCRIPT_SRC = `https://www.redditstatic.com/ads/pixel.js?pixel_id=${REDDIT_PIXEL_ID}`

type IubendaPreferences = {
  consent?: boolean
  purposes?: Record<string, boolean>
}

type RedditPixelFunction = (
  command: "init" | "track",
  eventNameOrPixelId: string,
  metadata?: Record<string, unknown>
) => void

type RedditPixelQueueFunction = RedditPixelFunction & {
  callQueue?: Parameters<RedditPixelFunction>[]
  sendEvent?: RedditPixelFunction
}

type WindowWithTracking = Window & {
  __appboxRedditLastPageVisit?: string
  __appboxRedditAdvertisingConsentGranted?: boolean
  __appboxRedditAdvertisingConsentNotNeeded?: boolean
  __appboxRedditPixelInitialized?: boolean
  appboxAllowRedditTracking?: () => void
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
  if (
    trackingWindow.__appboxRedditAdvertisingConsentGranted ||
    trackingWindow.__appboxRedditAdvertisingConsentNotNeeded
  ) {
    return true
  }

  const preferences = trackingWindow._iub?.cs?.api?.getPreferences?.()

  return (
    preferences?.consent === true ||
    preferences?.purposes?.[IUBENDA_ADVERTISING_PURPOSE] === true
  )
}

function loadRedditPixel() {
  const trackingWindow = window as WindowWithTracking

  if (typeof trackingWindow.rdt !== "function") {
    const rdt = ((...args: Parameters<RedditPixelFunction>) => {
      if (rdt.sendEvent) {
        rdt.sendEvent(...args)
        return
      }

      rdt.callQueue?.push(args)
    }) as RedditPixelQueueFunction

    rdt.callQueue = []
    trackingWindow.rdt = rdt
  }

  if (!document.getElementById(REDDIT_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script")
    script.id = REDDIT_PIXEL_SCRIPT_ID
    script.src = REDDIT_PIXEL_SCRIPT_SRC
    script.async = true
    script.className = "_iub_cs_activate"
    script.setAttribute("data-iub-purposes", IUBENDA_ADVERTISING_PURPOSE)
    document.head.appendChild(script)
  }

  if (!trackingWindow.__appboxRedditPixelInitialized) {
    trackingWindow.rdt("init", REDDIT_PIXEL_ID)
    trackingWindow.__appboxRedditPixelInitialized = true
  }
}

export function allowRedditTracking() {
  if (typeof window === "undefined") return

  ;(window as WindowWithTracking).__appboxRedditAdvertisingConsentGranted =
    true
  trackRedditPageVisit()
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
  loadRedditPixel()

  if (typeof trackingWindow.rdt !== "function") return

  const currentUrl = window.location.href
  if (trackingWindow.__appboxRedditLastPageVisit === currentUrl) return

  trackingWindow.rdt("track", "PageVisit")
  trackingWindow.__appboxRedditLastPageVisit = currentUrl
}
