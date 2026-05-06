"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { createBlogKudo, getBlogKudos, type BlogKudos } from "../kudos"

export function useBlogKudos(slug: string, token?: string) {
  return useQuery({
    queryKey: queryKeys.blogKudos.detail(slug, token),
    queryFn: () => getBlogKudos(slug, token),
    enabled: slug.length > 0
  })
}

export function useCreateBlogKudo(slug: string, token?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing kudos token")
      }

      return createBlogKudo(slug, token)
    },
    onMutate: async () => {
      const queryKey = queryKeys.blogKudos.detail(slug, token)
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<BlogKudos>(queryKey)

      queryClient.setQueryData<BlogKudos>(queryKey, (current) => {
        if (!current) {
          return current
        }

        if (current.hasKudoed) {
          return current
        }

        return {
          ...current,
          count: current.count + 1,
          hasKudoed: true
        }
      })

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.blogKudos.detail(slug, token),
          context.previous
        )
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.blogKudos.detail(slug, token), data)
    }
  })
}
