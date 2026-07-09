export const REDDIT_CAMPAIGN_ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "rdt_cid"
] as const

export type RedditCampaignAttributionParam =
  (typeof REDDIT_CAMPAIGN_ATTRIBUTION_PARAMS)[number]

export type RedditCampaignAttribution = Partial<
  Record<RedditCampaignAttributionParam, string>
>

export function sanitizeAttributionValue(value: string | null) {
  if (!value) return undefined

  const trimmedValue = value.trim()
  if (!trimmedValue) return undefined

  return trimmedValue.slice(0, 256)
}

export function collectRedditAttributionFromSearchParams(
  searchParams: URLSearchParams
) {
  const attribution: RedditCampaignAttribution = {}

  REDDIT_CAMPAIGN_ATTRIBUTION_PARAMS.forEach((param) => {
    const value = sanitizeAttributionValue(searchParams.get(param))
    if (value) {
      attribution[param] = value
    }
  })

  return attribution
}

export function hasRedditAttribution(attribution: RedditCampaignAttribution) {
  return REDDIT_CAMPAIGN_ATTRIBUTION_PARAMS.some((param) => attribution[param])
}
