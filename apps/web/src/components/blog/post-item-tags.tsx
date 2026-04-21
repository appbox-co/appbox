import type { Blog } from "contentlayer/generated"
import { Link } from "@/i18n/routing"
import { Badge } from "../ui/badge"
import { PaginationEllipsis } from "../ui/pagination"

export function BlogPostItemTags({
  post,
  currentTag,
  limitOfTagsToDisplay = 5
}: {
  post: Blog
  currentTag?: string | null
  limitOfTagsToDisplay?: number
}) {
  const totalOfTags = post?.tags?.length || 0
  const shouldDisplayEllipsis = totalOfTags > limitOfTagsToDisplay

  if (!post?.tags) {
    return null
  }

  const tagsToShow = shouldDisplayEllipsis
    ? post.tags.slice(0, limitOfTagsToDisplay)
    : post.tags

  const uniqueTags = Array.from(new Set(tagsToShow))

  const activeTag = currentTag ?? ""

  return (
    <div className="flex w-fit flex-wrap items-center gap-2 pt-4">
      {uniqueTags.map((tag) => {
        const isCurrentTagActive = tag === activeTag

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
