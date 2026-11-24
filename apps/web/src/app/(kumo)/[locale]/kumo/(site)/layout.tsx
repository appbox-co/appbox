import type { ReactNode } from "react"
import { getApps } from "@/api/appbox/apps"
import { docsSectionTitle } from "@/config/docs"
import { getAllBlogs, getAllDocs } from "@/lib/content"
import "@/styles/kumo-site.css"
import { wallApps } from "../_components/home/catalogue"
import { SiteFooter } from "../_components/site/site-footer"
import { SiteShell, type SiteSearchData } from "../_components/site/site-shell"

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
  const apps = await getApps(true)
  const inLocale = (slug: string) => slug.split("/")[0] === locale

  const search: SiteSearchData = {
    apps: wallApps(apps).map(({ name, icon, category }) => ({
      name,
      icon,
      category
    })),
    docs: getAllDocs()
      .filter((doc) => inLocale(doc.slugAsParams))
      .map((doc) => {
        const [, section, ...rest] = doc.slugAsParams.split("/")
        return {
          title: doc.title,
          section: docsSectionTitle(section),
          href: `/docs/${[section, ...rest].join("/")}`
        }
      }),
    posts: getAllBlogs()
      .filter((post) => inLocale(post.slugAsParams))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((post) => ({
        title: post.title,
        date: post.date,
        href: `/blog/${post.slugAsParams.split("/").slice(1).join("/")}`
      }))
  }

  return (
    <SiteShell search={search} footer={<SiteFooter />}>
      {children}
    </SiteShell>
  )
}
