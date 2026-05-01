"use client"

import { useQuery } from "@tanstack/react-query"
import type { CustomField } from "@/api/apps/app-store"
import type { MarketingContent } from "@/types/marketing-blocks"

export interface AppVersion {
  id: number
  version: string
  app_slots: number | null
  memory: number
  cpus: number
  created_at: string
  changes: string | null
  custom_field_preinstall_description?: string | null
  custom_field_postinstall_description?: string | null
}

export interface AppDetails {
  id: number
  display_name: string
  publisher: string
  description: string
  short_description: string
  rating: number
  upvotes: number
  downvotes: number
  created_at: string
  version: string
  featured: number
  app_slots: number
  icon_image: string
  devsite: string
  categories: string[]
  RequiresDomain?: number
  subdomain?: string | null
  marketing_content?: MarketingContent | null
  versions?: AppVersion[]
  customFields?: Record<string, CustomField>
  custom_field_preinstall_description?: string | null
  custom_field_postinstall_description?: string | null
}

const PUBLIC_APP_ENDPOINT = "https://api.appbox.co/v1/apps/public/app"

function getLookupCandidates(appName: string): string[] {
  let decodedName = appName
  try {
    decodedName = decodeURIComponent(appName)
  } catch {
    // Keep the original value if the route segment is not URI encoded.
  }

  const trimmedName = decodedName.trim()
  const candidates = [trimmedName]

  if (trimmedName.includes("-")) {
    candidates.push(trimmedName.replace(/-/g, " "))
  }

  return [...new Set(candidates.filter(Boolean))]
}

async function fetchAppDetails(appName: string): Promise<AppDetails> {
  const candidates = getLookupCandidates(appName)
  let lastError: Error | null = null

  for (const candidate of candidates) {
    const response = await fetch(
      `${PUBLIC_APP_ENDPOINT}/${encodeURIComponent(candidate)}`
    )

    if (response.ok) {
      return response.json()
    }

    lastError = new Error(
      `Failed to fetch app details for ${appName}: ${response.status} ${response.statusText}`
    )
  }

  throw lastError ?? new Error(`Failed to fetch app details for ${appName}`)
}

export function useAppDetails(appName: string | null) {
  const {
    data: appDetails,
    isLoading,
    error
  } = useQuery({
    queryKey: ["app-details", appName],
    queryFn: () => fetchAppDetails(appName as string),
    enabled: !!appName // Only run the query if appName is provided
  })

  return { appDetails, isLoading, error }
}
