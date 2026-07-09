import {
  collectRedditAttributionFromSearchParams,
  sanitizeAttributionValue
} from "@/lib/reddit-campaign-attribution"

const BILLING_URL = "https://billing.appbox.co/order.php"
const ALLOWED_BILLING_CYCLES = new Set([
  "monthly",
  "quarterly",
  "semiannually",
  "annually"
])
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
] as const

function sanitizeProductId(value: string | null) {
  const sanitizedValue = sanitizeAttributionValue(value)
  if (!sanitizedValue || !/^\d+$/.test(sanitizedValue)) return undefined

  return sanitizedValue
}

function sanitizeBillingCycle(value: string | null) {
  const sanitizedValue = sanitizeAttributionValue(value)
  if (!sanitizedValue || !ALLOWED_BILLING_CYCLES.has(sanitizedValue)) {
    return "monthly"
  }

  return sanitizedValue
}

function sanitizePromoCode(value: string | null) {
  const sanitizedValue = sanitizeAttributionValue(value)
  if (!sanitizedValue || !/^[a-z0-9_-]+$/i.test(sanitizedValue)) {
    return undefined
  }

  return sanitizedValue
}

export function buildRedditOrderBillingUrl(searchParams: URLSearchParams) {
  const productId = sanitizeProductId(searchParams.get("pid"))

  if (!productId) {
    return null
  }

  const billingCycle = sanitizeBillingCycle(searchParams.get("billingcycle"))
  const promoCode = sanitizePromoCode(searchParams.get("promocode"))
  const landingId = sanitizeAttributionValue(searchParams.get("landing_id"))
  const attribution = collectRedditAttributionFromSearchParams(searchParams)

  const billingUrl = new URL(BILLING_URL)
  billingUrl.searchParams.set("spage", "product")
  billingUrl.searchParams.set("a", "add")
  billingUrl.searchParams.set("pid", productId)
  billingUrl.searchParams.set("billingcycle", billingCycle)

  if (promoCode) {
    billingUrl.searchParams.set("promocode", promoCode)
  }

  UTM_PARAMS.forEach((param) => {
    const value = attribution[param]
    if (value) {
      billingUrl.searchParams.set(param, value)
    }
  })

  if (attribution.rdt_cid) {
    billingUrl.searchParams.set("rdt_cid_present", "1")
  }

  return {
    billingUrl,
    attribution,
    landingId,
    productId,
    billingCycle
  }
}
