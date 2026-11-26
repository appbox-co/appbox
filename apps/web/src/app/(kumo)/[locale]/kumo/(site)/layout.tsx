import type { ReactNode } from "react"
import { getApps } from "@/api/appbox/apps"
import "@/styles/kumo-site.css"
import { SiteFooter } from "../_components/site/site-footer"
import { siteSearchData } from "../_components/site/site-search"
import { SiteShell } from "../_components/site/site-shell"

/**
 * Layout for the public pages on Kumo: header, footer and the ⌘K search
 * over the public catalogue (cached for an hour, as on the marketing pages),
 * the docs and the blog.
 */
export default async function KumoSiteLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const search = siteSearchData(locale, await getApps(true))

  return (
    <SiteShell search={search} footer={<SiteFooter />}>
      {children}
    </SiteShell>
  )
}
