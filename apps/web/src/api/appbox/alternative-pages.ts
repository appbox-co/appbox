import type { MarketingContent } from "@/types/marketing-blocks"
import type { AppDetails } from "./hooks/use-app-details"

const PUBLIC_ALTERNATIVES_ENDPOINT =
  "https://api.appbox.co/v1/apps/public/alternatives-to"

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

export type AlternativeEntry = AppboxAlternative | ExternalAlternative

export interface AlternativePageDetails extends AlternativePageSummary {
  content?: MarketingContent | null
  alternatives: AlternativeEntry[]
}

export async function getAlternativePages(): Promise<AlternativePageSummary[]> {
  const response = await fetch(PUBLIC_ALTERNATIVES_ENDPOINT, {
    next: { revalidate: 3600 }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch alternative pages: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

export async function getAlternativePage(
  slug: string
): Promise<AlternativePageDetails> {
  const response = await fetch(
    `${PUBLIC_ALTERNATIVES_ENDPOINT}/${encodeURIComponent(slug)}`,
    { next: { revalidate: 3600 } }
  )

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
