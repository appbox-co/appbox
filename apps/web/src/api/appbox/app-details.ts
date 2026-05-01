// This is a server-side API function
import type { AppDetails } from "./hooks/use-app-details"

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

export async function getAppDetails(appName: string): Promise<AppDetails> {
  const candidates = getLookupCandidates(appName)
  let lastResponse: {
    url: string
    status: number
    statusText: string
    body: string
  } | null = null

  for (const candidate of candidates) {
    const url = `${PUBLIC_APP_ENDPOINT}/${encodeURIComponent(candidate)}`
    const response = await fetch(url, { next: { revalidate: 3600 } }) // Cache for 1 hour

    if (response.ok) {
      return response.json()
    }

    let body: string
    try {
      body = await response.text()
    } catch {
      body = "Could not read response body"
    }

    lastResponse = {
      url,
      status: response.status,
      statusText: response.statusText,
      body
    }
  }

  if (lastResponse) {
    throw new Error(
      `Failed to fetch app details for ${appName}: ${lastResponse.status} ${lastResponse.statusText} - ${lastResponse.body} (${lastResponse.url})`
    )
  }

  throw new Error(
    `Failed to fetch app details for ${appName}: missing app name`
  )
}
