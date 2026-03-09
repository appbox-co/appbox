"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { getRecentBlogPosts, type BlogPost } from "../blog"

export function useRecentBlogPosts(limit = 3, locale = "en") {
  return useQuery({
    queryKey: queryKeys.blogPosts.recent(limit, locale),
    queryFn: () => getRecentBlogPosts(limit, locale)
  })
}

export type { BlogPost }
