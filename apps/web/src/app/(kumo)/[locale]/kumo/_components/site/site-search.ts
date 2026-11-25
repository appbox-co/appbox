/*
 * What the public pages' ⌘K search lists: the catalogue's apps, the docs and
 * the blog posts in the visitor's language. Server-side, so the layout can
 * build it.
 */
import type { App } from "@/api/appbox/hooks/use-apps"
import { docsSectionTitle } from "@/config/docs"
import { getAllBlogs, getAllDocs } from "@/lib/content"
import { catalogueApp, type CatalogueApp } from "../site-home/catalogue"

export interface SiteSearchData {
  apps: CatalogueApp[]
  docs: { title: string; section: string; href: string }[]
  posts: { title: string; date: string; href: string }[]
}

export function siteSearchData(locale: string, apps: App[]): SiteSearchData {
  // Content slugs start with their language: "en/platform/app-boost".
  const inLocale = (slug: string) => slug.split("/")[0] === locale
  const withoutLocale = (slug: string) => slug.split("/").slice(1)

  return {
    apps: [...apps]
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map(catalogueApp),
    docs: getAllDocs()
      .filter((doc) => inLocale(doc.slugAsParams))
      .map((doc) => {
        const path = withoutLocale(doc.slugAsParams)
        return {
          title: doc.title,
          section: docsSectionTitle(path[0]),
          href: `/docs/${path.join("/")}`
        }
      }),
    posts: getAllBlogs()
      .filter((post) => inLocale(post.slugAsParams))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((post) => ({
        title: post.title,
        date: post.date,
        href: `/blog/${withoutLocale(post.slugAsParams).join("/")}`
      }))
  }
}
