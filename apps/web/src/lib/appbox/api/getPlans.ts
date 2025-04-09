// Server-side function to fetch plans data
import { PlansData } from "@/components/ui/plans"

export async function getPlans(): Promise<PlansData> {
  try {
    const response = await fetch("https://billing.appbox.co/feeds/plans.php", {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch plans data")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching plans data:", error)
    throw error
  }
}
