"use client"

import { useMemo, type ReactNode } from "react"
import { BookOpenIcon, NewspaperIcon } from "@phosphor-icons/react"
import { AppIcon } from "../app-icon"
import { QuickSearchProvider, type SearchGroup } from "../quick-search"
import { SiteHeader } from "./site-header"

export interface SiteSearchData {
  apps: { name: string; icon: string; category: string }[]
  docs: { title: string; section: string; href: string }[]
  posts: { title: string; date: string; href: string }[]
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  })

/**
 * The public pages' frame: the header, the ⌘K search over the catalogue,
 * docs and blog, and the dashed column every section sits in.
 */
export function SiteShell({
  search,
  footer,
  children
}: {
  search: SiteSearchData
  footer: ReactNode
  children: ReactNode
}) {
  const groups = useMemo<SearchGroup[]>(
    () => [
      {
        id: "apps",
        label: "Apps",
        items: search.apps.map((app) => ({
          id: `app-${app.name}`,
          title: app.name,
          context: app.category,
          href: `/apps/${encodeURIComponent(app.name)}`,
          icon: <AppIcon icon={app.icon} name={app.name} />
        }))
      },
      {
        id: "docs",
        label: "Docs",
        items: search.docs.map((doc) => ({
          id: `doc-${doc.href}`,
          title: doc.title,
          context: doc.section,
          href: doc.href,
          icon: <BookOpenIcon size={16} />
        }))
      },
      {
        id: "blog",
        label: "Blog",
        items: search.posts.map((post) => ({
          id: `post-${post.href}`,
          title: post.title,
          context: formatDate(post.date),
          href: post.href,
          icon: <NewspaperIcon size={16} />
        }))
      }
    ],
    [search]
  )

  return (
    <QuickSearchProvider
      groups={groups}
      placeholder="Search apps, docs and blog posts"
    >
      <div className="ks-page">
        <div className="ks-frame">
          <SiteHeader appCount={search.apps.length} />
          <main>{children}</main>
          {footer}
        </div>
      </div>
    </QuickSearchProvider>
  )
}
