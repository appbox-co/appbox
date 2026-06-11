"use client"

import posthog from "posthog-js"
import {
  buildBillingCheckoutProperties,
  withAttributionParams,
  type BillingCheckoutProperties,
  type BillingCheckoutTrigger
} from "@/lib/marketing-attribution"

// Capture a custom event
export const captureEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  posthog.capture(eventName, properties)
}

export const captureBeginCheckoutEvent = (
  properties: BillingCheckoutProperties
) => {
  try {
    posthog.capture("appbox_begin_checkout", properties)
  } catch {
    // Checkout should never be blocked by analytics failures.
  }
}

export const trackBeginCheckout = (
  url: string,
  trigger: BillingCheckoutTrigger,
  properties: BillingCheckoutProperties = {}
) => {
  const attributedUrl = withAttributionParams(url)

  captureBeginCheckoutEvent(
    buildBillingCheckoutProperties(attributedUrl, trigger, properties)
  )

  return attributedUrl
}

// Identify a user
export const identifyUser = (
  userId: string,
  userProperties?: Record<string, unknown>
) => {
  posthog.identify(userId, userProperties)
}

// Reset user identification (for logout)
export const resetUser = () => {
  posthog.reset()
}

// Opt in/out of tracking
export const optIn = () => {
  posthog.opt_in_capturing()
}

export const optOut = () => {
  posthog.opt_out_capturing()
}

// Check if user has opted out
export const hasOptedOut = () => {
  return posthog.has_opted_out_capturing()
}

// Get distinct ID
export const getDistinctId = () => {
  return posthog.get_distinct_id()
}

// Enable/disable debug mode
export const enableDebug = () => {
  posthog.debug()
}

// Feature flags
export const isFeatureEnabled = (flagKey: string) => {
  return posthog.isFeatureEnabled(flagKey)
}

export const getFeatureFlag = (flagKey: string) => {
  return posthog.getFeatureFlag(flagKey)
}
