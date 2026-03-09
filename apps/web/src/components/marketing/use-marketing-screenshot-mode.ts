"use client"

import { useEffect, useState } from "react"
import {
  MARKETING_SCREENSHOT_MODE_DEFAULT,
  MARKETING_SCREENSHOT_QUERY_PARAM,
  MARKETING_SCREENSHOT_STORAGE_KEY
} from "@/config/marketing-screenshot-mode"

const TRUE_VALUES = new Set(["1", "true", "yes", "on"])
const FALSE_VALUES = new Set(["0", "false", "no", "off"])

function parseBoolean(value: string | null): boolean | undefined {
  if (!value) return undefined

  const normalized = value.trim().toLowerCase()
  if (TRUE_VALUES.has(normalized)) return true
  if (FALSE_VALUES.has(normalized)) return false
  return undefined
}

function readMarketingScreenshotMode(): boolean {
  if (typeof window === "undefined") return MARKETING_SCREENSHOT_MODE_DEFAULT

  const queryValue = parseBoolean(
    new URL(window.location.href).searchParams.get(
      MARKETING_SCREENSHOT_QUERY_PARAM
    )
  )
  const storageValue = parseBoolean(
    window.localStorage.getItem(MARKETING_SCREENSHOT_STORAGE_KEY)
  )

  if (queryValue !== undefined) return queryValue
  if (storageValue !== undefined) return storageValue
  return MARKETING_SCREENSHOT_MODE_DEFAULT
}

export function useMarketingScreenshotMode(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() =>
    readMarketingScreenshotMode()
  )

  useEffect(() => {
    queueMicrotask(() => setEnabled(readMarketingScreenshotMode()))
  }, [])

  return enabled
}
