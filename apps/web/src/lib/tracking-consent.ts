"use client"

export const IUBENDA_MEASUREMENT_PURPOSE = "4"
export const IUBENDA_ADVERTISING_PURPOSE = "5"

type IubendaPreferences = {
  consent?: boolean
  purposes?: Record<string, boolean>
}

type WindowWithTrackingConsent = Window & {
  __appboxMeasurementConsentGranted?: boolean
  __appboxMeasurementConsentNotNeeded?: boolean
  __appboxAdvertisingConsentGranted?: boolean
  __appboxAdvertisingConsentNotNeeded?: boolean
  _iub?: {
    cs?: {
      api?: {
        getPreferences?: () => IubendaPreferences | undefined
      }
    }
  }
}

function trackingWindow(): WindowWithTrackingConsent | undefined {
  if (typeof window === "undefined") return undefined
  return window as WindowWithTrackingConsent
}

function iubendaPreferences(): IubendaPreferences | undefined {
  return trackingWindow()?._iub?.cs?.api?.getPreferences?.()
}

function hasPurposeConsent(purpose: string) {
  const preferences = iubendaPreferences()

  return (
    preferences?.consent === true || preferences?.purposes?.[purpose] === true
  )
}

function hasObjectedToPurpose(purpose: string) {
  const preferences = iubendaPreferences()
  if (!preferences) return false

  return (
    preferences.purposes?.[purpose] === false ||
    (preferences.consent === false && preferences.purposes?.[purpose] !== true)
  )
}

export function allowsStatisticalAnalytics() {
  if (typeof window === "undefined") return false

  return !hasObjectedToPurpose(IUBENDA_MEASUREMENT_PURPOSE)
}

export function hasMeasurementConsent() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return false

  return (
    currentWindow.__appboxMeasurementConsentGranted === true ||
    currentWindow.__appboxMeasurementConsentNotNeeded === true ||
    hasPurposeConsent(IUBENDA_MEASUREMENT_PURPOSE)
  )
}

export function hasAdvertisingConsent() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return false

  return (
    currentWindow.__appboxAdvertisingConsentGranted === true ||
    currentWindow.__appboxAdvertisingConsentNotNeeded === true ||
    hasPurposeConsent(IUBENDA_ADVERTISING_PURPOSE)
  )
}

export function allowMeasurementTracking() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return

  currentWindow.__appboxMeasurementConsentGranted = true
}

export function allowMeasurementTrackingWithoutPreference() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return

  currentWindow.__appboxMeasurementConsentNotNeeded = true
}

export function allowAdvertisingTracking() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return

  currentWindow.__appboxAdvertisingConsentGranted = true
}

export function allowAdvertisingTrackingWithoutPreference() {
  const currentWindow = trackingWindow()
  if (!currentWindow) return

  currentWindow.__appboxAdvertisingConsentNotNeeded = true
}
