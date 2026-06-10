"use client"

const STORAGE_KEY = "appbox.marketing_attribution"

const ATTRIBUTION_PARAM_NAMES = [
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content"
] as const

type AttributionParamName = (typeof ATTRIBUTION_PARAM_NAMES)[number]
type AttributionParams = Partial<Record<AttributionParamName, string>>

function readStoredAttributionParams(): AttributionParams {
  if (typeof window === "undefined") return {}

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const parsed = JSON.parse(stored) as Record<string, unknown>
    return ATTRIBUTION_PARAM_NAMES.reduce<AttributionParams>((params, name) => {
      const value = parsed[name]
      if (typeof value === "string" && value) {
        params[name] = value
      }
      return params
    }, {})
  } catch {
    return {}
  }
}

function collectAttributionParams(search: string): AttributionParams {
  const source = new URLSearchParams(search)

  return ATTRIBUTION_PARAM_NAMES.reduce<AttributionParams>((params, name) => {
    const value = source.get(name)
    if (value) {
      params[name] = value
    }
    return params
  }, {})
}

function hasAttributionParams(params: AttributionParams): boolean {
  return Object.keys(params).length > 0
}

export function persistAttributionParams(search = ""): AttributionParams {
  if (typeof window === "undefined") return {}

  const currentSearch = search || window.location.search
  const incomingParams = collectAttributionParams(currentSearch)
  const storedParams = readStoredAttributionParams()
  const mergedParams = {
    ...storedParams,
    ...incomingParams
  }

  if (!hasAttributionParams(mergedParams)) {
    return {}
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedParams))
  } catch {
    return mergedParams
  }

  return mergedParams
}

export function getAttributionParams(): AttributionParams {
  if (typeof window === "undefined") return {}

  return {
    ...readStoredAttributionParams(),
    ...collectAttributionParams(window.location.search)
  }
}

export function withAttributionParams(url: string): string {
  if (typeof window === "undefined") return url

  const params = getAttributionParams()
  if (!hasAttributionParams(params)) return url

  try {
    const targetUrl = new URL(url, window.location.href)

    for (const [name, value] of Object.entries(params)) {
      if (value && !targetUrl.searchParams.has(name)) {
        targetUrl.searchParams.set(name, value)
      }
    }

    return targetUrl.toString()
  } catch {
    return url
  }
}

export function attachAttributionToBillingLinks(): () => void {
  if (typeof document === "undefined") return () => {}

  const handleClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest<HTMLAnchorElement>(
      'a[href*="billing.appbox.co"]'
    )
    if (!anchor) return

    anchor.href = withAttributionParams(anchor.href)
  }

  document.addEventListener("click", handleClick, true)

  return () => {
    document.removeEventListener("click", handleClick, true)
  }
}
