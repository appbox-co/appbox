"use client"

import {
  allowAdvertisingTracking,
  allowAdvertisingTrackingWithoutPreference,
  hasAdvertisingConsent,
  IUBENDA_ADVERTISING_PURPOSE
} from "@/lib/tracking-consent"

const REDDIT_PIXEL_ID = "a2_hofzgodvh6np"
const REDDIT_PIXEL_SCRIPT_ID = "appbox-reddit-pixel-js"
const REDDIT_PIXEL_SCRIPT_SRC = `https://www.redditstatic.com/ads/pixel.js?pixel_id=${REDDIT_PIXEL_ID}`

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
  __appboxRedditPixelInitialized?: boolean
  appboxAllowRedditTracking?: () => void
  rdt?: RedditPixelFunction
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

  allowAdvertisingTracking()
  trackRedditPageVisit()
}

export function allowRedditTrackingWithoutPreference() {
  if (typeof window === "undefined") return

  allowAdvertisingTrackingWithoutPreference()
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
