import type { Blog } from "contentlayer/generated"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { badgeVariants } from "../ui/badge"

export async function BlogPostTags({ post }: { post: Blog }) {
  if (!post.tags) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 pt-4 md:gap-2">
      {post.tags.map((tag) => (
        <Link
          key={tag}
          href={`/blog?tag=${encodeURI(tag)}`}
          className={cn(badgeVariants({ variant: "secondary" }), "gap-1")}
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
