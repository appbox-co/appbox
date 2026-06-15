import type { AppDetails } from "./hooks/use-app-details"
import type { MarketingContent } from "@/types/marketing-blocks"

const PUBLIC_ALTERNATIVES_ENDPOINT =
  "https://api.appbox.co/v1/apps/public/alternatives"

export interface AlternativePageSummary {
  id: number
  slug: string
  competitor_name: string
  target_keyword: string
  app: AppDetails
  created_at?: string
  updated_at?: string
}

export interface AlternativePageDetails extends AlternativePageSummary {
  alternative_content?: MarketingContent | null
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
    const body = await response.text().catch(() => "Could not read response body")
    throw new Error(
      `Failed to fetch alternative page ${slug}: ${response.status} ${response.statusText} - ${body}`
    )
  }

  return response.json()
}
