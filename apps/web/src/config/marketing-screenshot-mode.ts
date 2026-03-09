const TRUE_VALUES = new Set(["1", "true", "yes", "on"])

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  return TRUE_VALUES.has(value.trim().toLowerCase())
}

export const MARKETING_SCREENSHOT_QUERY_PARAM = "screenshotMode"
export const MARKETING_SCREENSHOT_STORAGE_KEY =
  "appbox-marketing-screenshot-mode"
export const MARKETING_SCREENSHOT_MODE_DEFAULT = parseBoolean(
  process.env.NEXT_PUBLIC_MARKETING_SCREENSHOT_MODE
)
