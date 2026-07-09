"use client"

import type { ComponentProps } from "react"
import { useCallback } from "react"
import type { PlansData } from "@/components/ui/plans"
import Plans from "@/components/ui/plans"
import type { RedditCampaignAttribution } from "@/lib/reddit-campaign-attribution"
import { hasAdvertisingConsent } from "@/lib/tracking-consent"

const BILLING_URL = "https://billing.appbox.co/order.php"
const DIRECT_BILLING_PARAMS = [
  "pid",
  "billingcycle",
  "promocode",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "rdt_cid",
  "landing_id"
]

interface RedditPlansSectionProps {
  plansData: PlansData
  landingId: string
  attribution: RedditCampaignAttribution
  eyebrow: string
  heading: string
  description: string
  messages: ComponentProps<typeof Plans>["messages"]
}

export function RedditPlansSection({
  plansData,
  landingId,
  attribution,
  eyebrow,
  heading,
  description,
  messages
}: RedditPlansSectionProps) {
  const prepareCheckoutUrl = useCallback((url: string) => {
    if (!hasAdvertisingConsent()) return url

    const orderUrl = new URL(url, window.location.origin)
    if (orderUrl.pathname !== "/reddit/order") return url

    const billingUrl = new URL(BILLING_URL)

    billingUrl.searchParams.set("spage", "product")
    billingUrl.searchParams.set("a", "add")

    DIRECT_BILLING_PARAMS.forEach((param) => {
      const value = orderUrl.searchParams.get(param)
      if (value) {
        billingUrl.searchParams.set(param, value)
      }
    })

    if (!billingUrl.searchParams.get("pid")) return url

    billingUrl.searchParams.set("appbox_tracking_consent", "1")

    return billingUrl.toString()
  }, [])

  return (
    <section id="plans-section" className="scroll-mt-4 pt-4">
      <div className="mb-2 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </div>

      <Plans
        data={plansData.data}
        messages={messages}
        buildBillingUrl={({ billingCycle, baseBillingUrl }) => {
          const billingUrl = new URL(baseBillingUrl)
          const productId = billingUrl.searchParams.get("pid")

          if (!productId) {
            return baseBillingUrl
          }

          const orderUrl = new URL("/reddit/order", window.location.origin)

          orderUrl.searchParams.set("pid", productId)
          orderUrl.searchParams.set("billingcycle", billingCycle)

          if (landingId) {
            orderUrl.searchParams.set("landing_id", landingId)
          }

          const promoCode = billingUrl.searchParams.get("promocode")
          if (promoCode) {
            orderUrl.searchParams.set("promocode", promoCode)
          }

          Object.entries(attribution).forEach(([key, value]) => {
            if (value) {
              orderUrl.searchParams.set(key, value)
            }
          })

          return `${orderUrl.pathname}${orderUrl.search}`
        }}
        prepareCheckoutUrl={prepareCheckoutUrl}
      />
    </section>
  )
}
