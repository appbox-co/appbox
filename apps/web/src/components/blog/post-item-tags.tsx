"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { Blog } from "contentlayer/generated"
import { Link } from "@/i18n/routing"
import { Badge } from "../ui/badge"
import { PaginationEllipsis } from "../ui/pagination"

export function BlogPostItemTags({
  post,
  limitOfTagsToDisplay = 5
}: {
  post: Blog
  limitOfTagsToDisplay?: number
}) {
  const searchParams = useSearchParams()

  const totalOfTags = post?.tags?.length || 0
  const shouldDisplayEllipsis = totalOfTags > limitOfTagsToDisplay

  const tags = useMemo(() => {
    if (!post?.tags) {
      return null
    }

    const tags = shouldDisplayEllipsis
      ? post.tags.slice(0, limitOfTagsToDisplay)
      : post.tags

    const uniqueTags = Array.from(new Set(tags))

    return uniqueTags
  }, [post?.tags, limitOfTagsToDisplay, shouldDisplayEllipsis])

  if (!tags) {
    return null
  }

  return (
    <div className="flex w-fit flex-wrap items-center gap-2 pt-4">
      {tags.map((tag) => {
        const currentTag = searchParams.get("tag") || ""
        const isCurrentTagActive = tag === currentTag

        const href = isCurrentTagActive
          ? "/blog"
          : `/blog?tag=${encodeURI(tag)}`

        return (
          <Link key={tag} href={href}>
            <Badge variant={isCurrentTagActive ? "default" : "secondary"}>
              {tag}
            </Badge>
          </Link>
        )
      })}

      {shouldDisplayEllipsis && (
        <Badge variant="secondary" className="pointer-events-none">
          <PaginationEllipsis className="h-full w-fit" />
        </Badge>
      )}
    </div>
  )
}
