/**
 * This file contains the configuration for the documentation
 * to be used by files like:
 * - src/components/command-menu.tsx
 * - src/components/mobile-nav.tsx
 * - src/app/[locale]/docs/layout.tsx
 * - src/lib/opendocs/components/docs/pager.tsx
 */

import { allDocs } from "contentlayer/generated"
import type { DocsConfig } from "@/lib/opendocs/types/docs"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import type { NavItemWithChildren } from "@/lib/opendocs/types/nav"

// Items that should be labeled as "new"
const newItems = [
  "/docs/mdx/frontmatter",
  "/docs/mdx/code",
  "/docs/mdx/components",
  "/docs/mdx"
]

// Helper function to build the sidebar navigation structure dynamically
function generateSidebarNav(
  locale: LocaleOptions = "en"
): NavItemWithChildren[] {
  // Create a mapping of sections to their documents
  interface DocInfo {
    title: string
    description: string
    href: string
    sort?: number
  }

  // First gather all docs by section
  const sectionToDocsMap = new Map<string, DocInfo[]>()

  // Filter docs for the current locale
  const docsInLocale = allDocs.filter((doc) =>
    doc.slugAsParams.startsWith(locale)
  )

  // Organize documents by section
  docsInLocale.forEach((doc) => {
    const [, mainSection, ...rest] = doc.slugAsParams.split("/")

    // Skip if no main section
    if (!mainSection) return

    // Initialize section if it doesn't exist
    if (!sectionToDocsMap.has(mainSection)) {
      sectionToDocsMap.set(mainSection, [])
    }

    // Build the path
    const docPath = [mainSection, ...rest].join("/")
    const href = `/docs/${docPath}`

    // Add document to its section
    sectionToDocsMap.get(mainSection)!.push({
      title: doc.title,
      description: doc.description,
      href,
      sort: doc.sort as number | undefined
    })
  })

  // Create the sidebar structure
  const sidebarNav: NavItemWithChildren[] = []

  // Process each section
  sectionToDocsMap.forEach((docs, section) => {
    // Create the main section item without an href
    const sectionItem: NavItemWithChildren = {
      title: {
        [locale]: section.charAt(0).toUpperCase() + section.slice(1)
      },
      items: []
    }

    // Add a "label" to the section if it's marked as new
    if (newItems.includes(`/docs/${section}`)) {
      sectionItem.label = { [locale]: "New" }
    }

    // Sort docs by sort field if available, otherwise by title
    const sortedDocs = [...docs].sort((a, b) => {
      // If both items have sort values, sort by those
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort
      }
      // If only a has a sort value, it comes first
      if (a.sort !== undefined) {
        return -1
      }
      // If only b has a sort value, it comes first
      if (b.sort !== undefined) {
        return 1
      }
      // Otherwise sort alphabetically by title
      return a.title.localeCompare(b.title)
    })

    // Add all docs from this section as direct links (simple items with hrefs)
    sortedDocs.forEach((doc) => {
      sectionItem.items.push({
        href: doc.href,
        title: {
          [locale]: doc.title
        },
        label: newItems.includes(doc.href) ? { [locale]: "New" } : undefined,
        items: []
      })
    })

    sidebarNav.push(sectionItem)
  })

  return [
    {
      title: {
        en: "Documentation",
        pt: "Documentação"
      },
      items: sidebarNav
    }
  ]
}

// Basic static configuration
const staticConfig = {
  mainNav: [
    {
      href: "/docs",
      title: {
        en: "Documentation",
        pt: "Documentação"
      }
    }
  ]
}

// Export the combined configuration
export const docsConfig: DocsConfig = {
  ...staticConfig,
  // Generate sidebarNav for each supported locale
  get sidebarNav() {
    return generateSidebarNav("en")
  }
} as const
