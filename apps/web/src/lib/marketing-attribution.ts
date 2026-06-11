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
export type BillingCheckoutTrigger =
  | "billing_link_click"
  | "plan_card_click"
  | "deploy_plan_select"
  | (string & {})

export type BillingCheckoutProperties = Record<string, unknown>

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

function withoutEmptyValues(
  properties: BillingCheckoutProperties
): BillingCheckoutProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false
      }

      if (Array.isArray(value) && value.length === 0) {
        return false
      }

      return true
    })
  )
}

function orderPackageSlug(pathname: string): string | undefined {
  const match = pathname.match(/^\/order\/appbox-packages\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

export function buildBillingCheckoutProperties(
  url: string,
  trigger: BillingCheckoutTrigger,
  properties: BillingCheckoutProperties = {}
): BillingCheckoutProperties {
  if (typeof window === "undefined") {
    return properties
  }

  const attributionParams = getAttributionParams()
  const attributionParamNames = Object.keys(attributionParams)

  try {
    const targetUrl = new URL(url, window.location.href)

    return withoutEmptyValues({
      checkout_trigger: trigger,
      source_host: window.location.host,
      source_pathname: window.location.pathname,
      source_url: `${window.location.origin}${window.location.pathname}`,
      destination_host: targetUrl.host,
      destination_pathname: targetUrl.pathname,
      destination_url: `${targetUrl.origin}${targetUrl.pathname}`,
      billing_spage: targetUrl.searchParams.get("spage"),
      billing_action: targetUrl.searchParams.get("a"),
      billing_product_id: targetUrl.searchParams.get("pid"),
      billing_cycle: targetUrl.searchParams.get("billingcycle"),
      order_package_slug: orderPackageSlug(targetUrl.pathname),
      attribution_present: attributionParamNames.length > 0,
      attribution_param_names: attributionParamNames,
      ...properties
    })
  } catch {
    return withoutEmptyValues({
      checkout_trigger: trigger,
      source_host: window.location.host,
      source_pathname: window.location.pathname,
      source_url: `${window.location.origin}${window.location.pathname}`,
      destination_url: url,
      attribution_present: attributionParamNames.length > 0,
      attribution_param_names: attributionParamNames,
      ...properties
    })
  }
}

export function attachAttributionToBillingLinks(
  onBillingLinkClick?: (properties: BillingCheckoutProperties) => void
): () => void {
  if (typeof document === "undefined") return () => {}

  const handleClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest<HTMLAnchorElement>(
      'a[href*="billing.appbox.co"]'
    )
    if (!anchor) return

    const attributedHref = withAttributionParams(anchor.href)
    anchor.href = attributedHref

    onBillingLinkClick?.(
      buildBillingCheckoutProperties(attributedHref, "billing_link_click", {
        link_text: anchor.innerText.trim().slice(0, 120),
        opens_new_tab: anchor.target === "_blank"
      })
    )
  }

  document.addEventListener("click", handleClick, true)

  return () => {
    document.removeEventListener("click", handleClick, true)
  }
}
