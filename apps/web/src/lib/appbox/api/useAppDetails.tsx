"use client"

import { useQuery } from "@tanstack/react-query"

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
}

async function fetchAppDetails(appName: string): Promise<AppDetails> {
  // Convert display name to API format (lowercase, spaces to underscores)
  const formattedName = appName.toLowerCase().replace(/\s+/g, "-")

  const response = await fetch(
    `https://api.appbox.co/v1/apps/public/app/${formattedName}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch app details for ${appName}`)
  }

  return response.json()
}

export function useAppDetails(appName: string | null) {
  const {
    data: appDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app-details", appName],
    queryFn: () => fetchAppDetails(appName as string),
    enabled: !!appName, // Only run the query if appName is provided
  })

  return { appDetails, isLoading, error }
}
