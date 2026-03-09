// Server-side function to fetch all apps
import type { App } from "./hooks/use-apps"

export async function getApps(all: boolean = false): Promise<App[]> {
  try {
    const response = await fetch(
      `https://api.appbox.co/v1/apps/public/all${all ? "" : "/1"}`,
      {
        headers: {
          "User-Agent": "Appbox-Web/2.0",
          Accept: "application/json"
        },
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch apps")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching apps:", error)
    return []
  }
}
