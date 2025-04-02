// Server-side function to fetch all apps
import { App } from './useApps'

export async function getApps(all: boolean = false): Promise<App[]> {
  try {
    const response = await fetch(
      `https://api.appbox.co/v1/apps/public/all${all ? '' : '/1'}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error('Failed to fetch apps')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching apps:', error)
    throw error
  }
}
