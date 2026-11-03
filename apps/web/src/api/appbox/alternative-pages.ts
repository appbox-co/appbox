import type { MarketingContent } from "@/types/marketing-blocks"
import type { AppDetails } from "./hooks/use-app-details"

const PUBLIC_ALTERNATIVES_ENDPOINT =
  "https://api.appbox.co/v1/apps/public/alternatives-to"

// Matches the alternatives pages' ISR interval, so a regeneration fetches
// fresh data and the index and sitemap list the same pages as the detail route.
const ALTERNATIVES_REVALIDATE_SECONDS = 300

export interface AlternativePageSummary {
  id: number
  slug: string
  competitor_name: string
  target_keyword: string
  summary?: string
  tags?: string[]
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  created_at?: string
  updated_at?: string
}

export interface AppboxAlternative {
  type: "appbox_app"
  rank?: number
  app: AppDetails
  best_for?: string
  description?: string
  caveat?: string
  highlights?: string[]
}

export interface ExternalAlternative {
  type: "external_tool"
  rank?: number
  name: string
  description?: string
  website_url?: string
  best_for?: string
  caveat?: string
  highlights?: string[]
}

export interface AppboxPlatformAlternative {
  type: "appbox_platform"
  rank?: number
  name: string
  description?: string
  website_url?: string
  best_for?: string
  caveat?: string
  highlights?: string[]
}

export type AlternativeEntry =
  | AppboxAlternative
  | AppboxPlatformAlternative
  | ExternalAlternative

export interface AlternativePageDetails extends AlternativePageSummary {
  content?: MarketingContent | null
  alternatives: AlternativeEntry[]
}

export async function getAlternativePages(): Promise<AlternativePageSummary[]> {
  const response = await fetch(PUBLIC_ALTERNATIVES_ENDPOINT, {
    next: { revalidate: ALTERNATIVES_REVALIDATE_SECONDS }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch alternative pages: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

// Resolves to null only when the API says the slug doesn't exist. Other
// failures throw, so an ISR page isn't cached as a 404 because of an API blip.
export async function getAlternativePage(
  slug: string
): Promise<AlternativePageDetails | null> {
  const response = await fetch(
    `${PUBLIC_ALTERNATIVES_ENDPOINT}/${encodeURIComponent(slug)}`,
    { next: { revalidate: ALTERNATIVES_REVALIDATE_SECONDS } }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const body = await response
      .text()
      .catch(() => "Could not read response body")
    throw new Error(
      `Failed to fetch alternative page ${slug}: ${response.status} ${response.statusText} - ${body}`
    )
  }

  return response.json()
}
