import { NextRequest, NextResponse } from "next/server"
import { buildRedditOrderBillingUrl } from "@/lib/reddit-order-url"
import { captureRedditCheckoutIntentEvent } from "@/lib/server/reddit-campaign-events"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const redirectData = buildRedditOrderBillingUrl(requestUrl.searchParams)

  if (!redirectData) {
    return NextResponse.redirect(new URL("/reddit", request.url))
  }

  await captureRedditCheckoutIntentEvent({
    path: requestUrl.pathname,
    destinationHost: redirectData.billingUrl.host,
    destinationPath: redirectData.billingUrl.pathname,
    attribution: redirectData.attribution,
    landingId: redirectData.landingId,
    billingProductId: redirectData.productId,
    billingCycle: redirectData.billingCycle
  })

  return NextResponse.redirect(redirectData.billingUrl)
}
