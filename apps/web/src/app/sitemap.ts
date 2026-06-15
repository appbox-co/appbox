import type { MetadataRoute } from "next"
import { allBlogs, allDocs } from "contentlayer/generated"
import { getAlternativePages } from "@/api/appbox/alternative-pages"
import { routing } from "@/i18n/routing"
import { absoluteUrl } from "@/lib/utils"

type Sitemap = MetadataRoute.Sitemap

export default async function sitemap(): Promise<Sitemap> {
  const paths: Sitemap = [
    {
      url: absoluteUrl(`/`),
      lastModified: new Date(),

      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [locale, absoluteUrl(`/${locale}`)])
        )
      }
    },

    {
      url: absoluteUrl(`/docs`),
      lastModified: new Date(),

      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [
            locale,
            absoluteUrl(`/${locale}/docs`)
          ])
        )
      }
    }
  ]

  const docPaths: Sitemap = allDocs.map((doc) => {
    const [, ...docSlugList] = doc.slugAsParams.split("/")
    const docSlug = docSlugList.join("/") || ""

    return {
      url: absoluteUrl(`/docs/${docSlug}`),
      lastModified: new Date(),

      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [
            locale,
            absoluteUrl(`/${locale}/docs/${docSlug}`)
          ])
        )
      }
    }
  })

  const blogPaths: Sitemap = allBlogs.map((post) => {
    const [, ...postSlugList] = post.slugAsParams.split("/")
    const postSlug = postSlugList.join("/") || ""

    return {
      url: absoluteUrl(`/blog/${postSlug}`),
      lastModified: new Date(),

      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [
            locale,
            absoluteUrl(`/${locale}/blog/${postSlug}`)
          ])
        )
      }
    }
  })

  let alternativePaths: Sitemap = []
  try {
    const alternativePages = await getAlternativePages()
    alternativePaths = alternativePages.flatMap((page) =>
      routing.locales.map((locale) => ({
        url: absoluteUrl(`/${locale}/alternatives/${page.slug}`),
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((alternateLocale) => [
              alternateLocale,
              absoluteUrl(`/${alternateLocale}/alternatives/${page.slug}`)
            ])
          )
        }
      }))
    )
  } catch {
    alternativePaths = []
  }

  return [...paths, ...docPaths, ...blogPaths, ...alternativePaths]
}
