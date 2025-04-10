import { allDocs, type Doc } from "contentlayer/generated"
import { docsConfig } from "@/config/docs"
import { routing } from "@/i18n/routing"
import type { LocaleOptions } from "../types/i18n"
import type { NavItem, NavItemWithChildren } from "../types/nav"
import { getSlugWithoutLocale } from "./locale"

export function makeLocalizedSlug(params: {
  locale: LocaleOptions | undefined
  slug: string[] | undefined
}) {
  const _slug = params.slug?.join("/")
  const _locale = params.locale || routing.defaultLocale

  const localizedSlug = [_locale, _slug].filter(Boolean).join("/")

  return localizedSlug
}

export async function getDocFromParams({
  params
}: {
  params: {
    locale: LocaleOptions | undefined
    slug: string[] | undefined
  }
}): Promise<(Doc & { notAvailable: boolean }) | null> {
  let localizedSlug = makeLocalizedSlug(params)
  let doc = allDocs.find((doc) => doc.slugAsParams === localizedSlug)

  if (!doc) {
    localizedSlug = makeLocalizedSlug({
      ...params,
      locale: routing.defaultLocale
    })

    doc = allDocs.find((doc) => doc.slugAsParams === localizedSlug)

    return doc ? { ...doc, notAvailable: true } : null
  }

  return { ...doc, notAvailable: false }
}

export function getBreadcrumb(docSlug: string) {
  const slug = getSlugWithoutLocale(docSlug, "docs")

  const findBreadcrumbPath = (
    items: NavItemWithChildren[],
    slug: string,
    path: NavItemWithChildren[] = []
  ): NavItem[] | null => {
    for (const item of items) {
      const newPath = [...path, item]

      if (item.href === slug) {
        return newPath
      }

      if (item.items) {
        const foundPath = findBreadcrumbPath(item.items, slug, newPath)

        if (foundPath) {
          return foundPath
        }
      }
    }

    return null
  }

  const makeBreadcrumb = (
    slug: string,
    config: typeof docsConfig
  ): NavItem[] | null => {
    for (const nav of config.sidebarNav) {
      const path = findBreadcrumbPath([nav], slug)

      if (path) {
        return path
      }
    }

    return null
  }

  const breadcrumbs = makeBreadcrumb(slug, docsConfig)

  return breadcrumbs || []
}
