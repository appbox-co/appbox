const APPBOX_ASSET_BASE = "https://api.appbox.co/assets/images/apps/"
const SAFE_COLOR_KEYWORDS = new Set(["black", "white", "transparent"])
const SAFE_COLOR_PATTERN =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}\s*\)|rgba\(\s*(\d{1,3}\s*,\s*){3}(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\))$/

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function isSafeExternalUrl(value: string): boolean {
  return isHttpUrl(value)
}

export function isSafeInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//")
}

export function isSafeLinkUrl(value: string): boolean {
  return isSafeInternalPath(value) || isSafeExternalUrl(value)
}

export function isSafeMarkdownHref(value: string): boolean {
  return (
    value.startsWith("#") ||
    isSafeInternalPath(value) ||
    isSafeExternalUrl(value) ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  )
}

export function isSafeCssColor(value: string): boolean {
  const trimmed = value.trim()
  return (
    SAFE_COLOR_KEYWORDS.has(trimmed.toLowerCase()) ||
    SAFE_COLOR_PATTERN.test(trimmed)
  )
}

export function isDeployPath(value: string): boolean {
  return (
    isSafeInternalPath(value) &&
    (value.startsWith("/appstore/app/") || value.includes("/app/"))
  )
}

export function resolveSafeScreenshotUrl(src: string): string | null {
  if (isSafeExternalUrl(src)) {
    const url = new URL(src)
    return url.hostname === "appbox.co" || url.hostname.endsWith(".appbox.co")
      ? src
      : null
  }

  if (
    src.includes("://") ||
    src.startsWith("//") ||
    src.startsWith("/") ||
    src.includes("..")
  ) {
    return null
  }

  return `${APPBOX_ASSET_BASE}${src.replace(/^\/+/, "")}`
}
