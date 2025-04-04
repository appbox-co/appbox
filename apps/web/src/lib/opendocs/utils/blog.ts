import { allBlogs, type Blog } from "contentlayer/generated"
import { routing } from "@/i18n/routing"
import type { BlogPageProps } from "../types/blog"

export function makeLocalizedSlug({ locale, slug }: BlogPageProps["params"]) {
  const _slug = slug?.join("/")
  const _locale = locale || routing.defaultLocale

  const localizedSlug = [_locale, _slug].filter(Boolean).join("/")

  return localizedSlug
}

export async function getBlogFromParams({
  params
}: BlogPageProps): Promise<(Blog & { notAvailable: boolean }) | null> {
  let localizedSlug = makeLocalizedSlug(params)
  let blog = allBlogs.find((blog) => blog.slugAsParams === localizedSlug)

  if (!blog) {
    localizedSlug = makeLocalizedSlug({
      ...params,
      locale: routing.defaultLocale
    })

    blog = allBlogs.find((blog) => blog.slugAsParams === localizedSlug)

    return blog ? { ...blog, notAvailable: true } : null
  }

  return { ...blog, notAvailable: false }
}
