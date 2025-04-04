import type { Blog } from "contentlayer/generated"
import { ChevronRightIcon } from "lucide-react"
import { Link } from "@/i18n/routing"

interface BlogPostBreadcrumbProps {
  post: Blog

  messages: {
    posts: string
  }
}

export function BlogPostBreadcrumb({
  post,
  messages
}: BlogPostBreadcrumbProps) {
  return (
    <div className="text-muted-foreground mb-4 flex items-center space-x-1 text-sm">
      <Link href="/blog" className="text-foreground hover:underline">
        {messages.posts}
      </Link>

      <ChevronRightIcon className="size-4" />

      <span className="truncate">{post.title}</span>
    </div>
  )
}
