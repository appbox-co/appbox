import "server-only"
import { headers } from "next/headers"
import type { RedditCampaignAttribution } from "@/lib/reddit-campaign-attribution"
import { captureServerEvent } from "./posthog-capture"

function getDeviceFamily(userAgent: string) {
  const normalizedUserAgent = userAgent.toLowerCase()

  if (/ipad|tablet/.test(normalizedUserAgent)) return "tablet"
  if (/mobile|iphone|android/.test(normalizedUserAgent)) return "mobile"
  if (userAgent) return "desktop"

  return "unknown"
}

function getSafeCampaignProperties(attribution: RedditCampaignAttribution) {
  return {
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    rdt_cid_present: Boolean(attribution.rdt_cid)
  }
}

export async function captureRedditLandingEvent({
  path,
  attribution,
  landingId
}: {
  path: string
  attribution: RedditCampaignAttribution
  landingId: string
}) {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? ""

  await captureServerEvent({
    event: "appbox_reddit_landing",
    distinctId: landingId,
    properties: {
      path,
      landing_id: landingId,
      ...getSafeCampaignProperties(attribution),
      device_family: getDeviceFamily(userAgent),
      captured_at: new Date().toISOString()
    }
  })
}

export async function captureRedditCheckoutIntentEvent({
  path,
  destinationHost,
  destinationPath,
  attribution,
  landingId,
  billingProductId,
  billingCycle
}: {
  path: string
  destinationHost: string
  destinationPath: string
  attribution: RedditCampaignAttribution
  landingId?: string
  billingProductId?: string
  billingCycle?: string
}) {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? ""

  await captureServerEvent({
    event: "appbox_reddit_checkout_intent",
    distinctId: landingId || `reddit_checkout_${Date.now()}`,
    properties: {
      path,
      landing_id: landingId,
      destination_host: destinationHost,
      destination_path: destinationPath,
      billing_product_id: billingProductId,
      billing_cycle: billingCycle,
      ...getSafeCampaignProperties(attribution),
      device_family: getDeviceFamily(userAgent),
      captured_at: new Date().toISOString()
    }
  })
}
