'use client'

import { useQuery } from '@tanstack/react-query'

export interface App {
  display_name: string
  publisher: string
  description: string
  rating: number
  version: string
  featured: number
  icon_image: string
  installs: number
  devsite: string
  app_slots: number
  created_at: string
  categories: string[]
}

async function fetchApps(all: boolean = false): Promise<App[]> {
  const response = await fetch(
    `https://api.appbox.co/v1/apps/public/all${all ? '' : '/1'}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch apps')
  }

  return response.json()
}

export function useApps(all: boolean = false) {
  const {
    data: apps = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['apps'],
    queryFn: () => fetchApps(all),
  })

  return { apps, isLoading, error }
}
