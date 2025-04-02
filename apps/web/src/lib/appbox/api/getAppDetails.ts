// This is a server-side API function
import { AppDetails } from './useAppDetails'

export async function getAppDetails(appName: string): Promise<AppDetails> {
  // Convert display name to API format (lowercase, spaces to hyphens)
  const formattedName = appName.toLowerCase().replace(/\s+/g, '-')

  try {
    const response = await fetch(
      `https://api.appbox.co/v1/apps/public/app/${formattedName}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch app details for ${appName}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching app details:', error)
    throw error
  }
}
