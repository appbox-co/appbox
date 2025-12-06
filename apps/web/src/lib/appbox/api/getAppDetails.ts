// This is a server-side API function
import { AppDetails } from "./useAppDetails"

export async function getAppDetails(appName: string): Promise<AppDetails> {
  // Convert display name to API format (lowercase, spaces to hyphens)
  const formattedName = appName.toLowerCase().replace(/\s+/g, "-")

  const url = `https://api.appbox.co/v1/apps/public/app/${formattedName}`

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }) // Cache for 1 hour

    if (!response.ok) {
      // Try to get the response body for more details
      let errorBody: string
      try {
        errorBody = await response.text()
      } catch {
        errorBody = "Could not read response body"
      }

      console.error(
        `API Error for ${appName}:`,
        `\n  URL: ${url}`,
        `\n  Status: ${response.status} ${response.statusText}`,
        `\n  Response body: ${errorBody}`
      )

      throw new Error(
        `Failed to fetch app details for ${appName}: ${response.status} ${response.statusText} - ${errorBody}`
      )
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching app details:", error)
    throw error
  }
}
