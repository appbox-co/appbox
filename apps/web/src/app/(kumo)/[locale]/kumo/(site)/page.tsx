import type { Metadata } from "next"
import { getApps } from "@/api/appbox/apps"
import { getPlans } from "@/api/appbox/plans"
import { launchWeekFlags } from "@/config/launch-week-flags"
import {
  allUnmetered,
  appIcons,
  categoryCounts,
  planFacts,
  wallApps
} from "../_components/site-home/catalogue"
import { SiteHomeView } from "../_components/site-home/site-home-view"

export const metadata: Metadata = {
  title: "Appbox · Kumo prototype · Home"
}

/** Affiliate links carry a numeric id; anything else is ignored. */
function affiliateFrom(value: string | string[] | undefined) {
  const id = Array.isArray(value) ? value[0] : value
  return id && /^\d+$/.test(id) ? id : undefined
}

/**
 * The home page on Kumo. Figures come from the public catalogue and the
 * billing plans feed, so the copy stays true when either changes.
 */
export default async function KumoHomePage({
  searchParams
}: {
  searchParams: Promise<{ aff?: string | string[] }>
}) {
  const [{ aff }, apps, plans] = await Promise.all([
    searchParams,
    getApps(true),
    getPlans()
  ])

  return (
    <SiteHomeView
      icons={appIcons(apps)}
      appCount={apps.length}
      wall={wallApps(apps)}
      categories={categoryCounts(apps)}
      facts={planFacts(plans)}
      plans={plans}
      unmetered={allUnmetered(plans)}
      boostEnabled={launchWeekFlags.day_2}
      affiliateId={affiliateFrom(aff)}
    />
  )
}
