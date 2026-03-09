export interface BlogPost {
  id: number
  title: string
  excerpt: string
  date: string
  slug: string
  image?: string
}

function getSlugFromBlogUrl(urlValue: string): string {
  try {
    const pathname = new URL(urlValue, "https://www.appbox.co").pathname
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 0) return ""

    const blogIndex = parts.findIndex((part) => part === "blog")
    if (blogIndex === -1) return parts.join("/")

    return parts.slice(blogIndex + 1).join("/")
  } catch {
    return ""
  }
}

/**
 * Blog API is not active in the backend. The old frontend fetched from the
 * external blog feed at appbox.co. We replicate that here.
 */
export async function getRecentBlogPosts(
  limit: number = 3,
  locale: string = "en"
): Promise<BlogPost[]> {
  try {
    const safeLocale = locale || "en"
    const res = await fetch(`/${safeLocale}/feed/blog.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Appbox-Web/2.0"
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    if (!res.ok) return []

    const data = await res.json()
    const items: BlogPost[] = (data.items ?? data ?? [])
      .slice(0, limit)

      .map((item: Record<string, unknown>, index: number) => ({
        id: (item.id as number | undefined) ?? index,
        title: String(item.title ?? ""),
        excerpt: (
          (item.content_text as string | undefined) ??
          (typeof item.content_html === "string"
            ? item.content_html.replace(/<[^>]*>/g, "")
            : undefined) ??
          (item.summary as string | undefined) ??
          ""
        ).slice(0, 200),
        date: String(
          item.date_modified ?? item.date_published ?? ""
        ),
        slug: item.url
          ? getSlugFromBlogUrl(String(item.url))
          : String(item.id ?? ""),
        image: (item.image as string | undefined) ?? undefined
      }))
    return items
  } catch {
    return []
  }
}
