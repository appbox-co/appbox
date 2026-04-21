import type { Blog } from "contentlayer/generated"
import { compareDesc } from "date-fns"
import Balancer from "react-wrap-balancer"
import { dateLocales, Link } from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import {
  getObjectValueByLocale,
  getSlugWithoutLocale
} from "@/lib/opendocs/utils/locale"
import { cn, formatDate, truncateText } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { Card } from "../ui/card"
import { Pagination } from "./pagination"
import { BlogPostItemTags } from "./post-item-tags"
import { ReadTime } from "./read-time"
import { RSSToggle } from "./rss-toggle"

interface PaginatedBlogPostsProps {
  posts: Blog[]
  perPage?: number
  locale: LocaleOptions
  currentPage: number
  currentTag: string | null

  messages: {
    by: string
    next: string
    previous: string
    min_read: string
    rss_feed: string
    read_more: string
    go_to_next_page: string
    go_to_previous_page: string
  }
}

export function PaginatedBlogPosts({
  posts,
  locale,
  messages,
  currentPage,
  currentTag,
  perPage = 10
}: PaginatedBlogPostsProps) {
  const filteredByTag = currentTag
    ? posts.filter((post) => post.tags?.includes(decodeURI(currentTag)))
    : posts

  const sortedPosts = filteredByTag
    .filter((post) => {
      const [localeFromSlug] = post.slugAsParams.split("/")
      return localeFromSlug === locale
    })
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))

  const totalOfPages = Math.ceil(sortedPosts.length / perPage)
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  return (
    <main className="relative mx-auto grid max-w-5xl space-y-6">
      <RSSToggle
        messages={{
          rss_feed: messages.rss_feed
        }}
      />

      <div
        className={cn("grid grid-cols-1 gap-4", {
          "md:grid-cols-2": paginatedPosts.length >= 2,
          "md:grid-cols-1": paginatedPosts.length < 2
        })}
      >
        {paginatedPosts.map((post) => {
          const postLink = getSlugWithoutLocale(post.slug, "blog")

          return (
            <Card
              key={post._id}
              className="dark:bg-card-primary flex size-full flex-col justify-between p-4 backdrop-blur-lg md:p-8"
            >
              <div>
                <div className="text-muted-foreground mb-2 flex items-center justify-between gap-1 text-xs">
                  <time dateTime={post.date}>
                    {formatDate(
                      post.date,
                      getObjectValueByLocale(dateLocales, locale)
                    )}
                  </time>

                  <ReadTime
                    time={post.readTimeInMinutes}
                    variant="unstyled"
                    messages={{
                      min_read: messages.min_read
                    }}
                  />
                </div>

                <Link
                  href={postLink}
                  className={cn("transition-all hover:opacity-65")}
                >
                  <h1 className="py-2 text-xl">
                    <Balancer>{post.title}</Balancer>
                  </h1>
                </Link>

                <p className="text-muted-foreground">
                  <Balancer>{truncateText(post.excerpt, 148)}</Balancer>
                </p>
              </div>

              <BlogPostItemTags post={post} currentTag={currentTag} />

              <Link
                href={postLink}
                className={cn(
                  "dark:hover:text-primary dark:text-primary-active transition-all",
                  buttonVariants({ variant: "link" }),
                  "mt-1 flex h-fit self-end p-0"
                )}
              >
                {messages.read_more}
              </Link>
            </Card>
          )
        })}
      </div>

      <Pagination
        pagesToShow={10}
        messages={messages}
        numberOfPages={totalOfPages}
        currentPage={currentPage}
        currentTag={currentTag}
      />
    </main>
  )
}
