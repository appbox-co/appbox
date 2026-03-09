"use client"

import { useQuery } from "@tanstack/react-query"
import { PlansData } from "@/components/ui/plans"

async function fetchPlans(): Promise<PlansData> {
  const response = await fetch("https://billing.appbox.co/feeds/plans.php")

  if (!response.ok) {
    throw new Error("Failed to fetch plans data")
  }

  return response.json()
}

export function usePlans() {
  const {
    data: plans,
    isLoading,
    error
  } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans
  })

  return { plans, isLoading, error }
}
