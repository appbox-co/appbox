"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query"
import type { InfiniteData } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  createComment,
  createCommentByType,
  deleteComment,
  deleteVote,
  getComments,
  getCommentsByType,
  updateComment,
  voteComment,
  type Comment,
  type CommentsPage
} from "../comments"

export function useComments(appId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments.byApp(appId),
    queryFn: ({ pageParam = 1 }) => getComments(appId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    enabled: appId > 0
  })
}

export function useCommentsByType(type: string, relId: number, token?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments.byType(type, relId, token),
    queryFn: ({ pageParam = 1 }) =>
      getCommentsByType(type, relId, pageParam as number, token),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    enabled: relId > 0 && type.length > 0
  })
}

// Flatten all loaded pages into a single Comment array
export function flattenComments(
  data: InfiniteData<CommentsPage> | undefined
): Comment[] {
  return data?.pages.flatMap((p) => p.items) ?? []
}

// Total comment count from the first page's metadata
export function totalCommentCount(
  data: InfiniteData<CommentsPage> | undefined
): number | undefined {
  return data?.pages[0]?.totalComments
}

export function useCreateCommentByType(
  type: string,
  relId: number,
  token?: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { comment: string; parent_id?: number }) =>
      createCommentByType({
        type,
        relid: relId,
        comment: data.comment,
        parent_id: data.parent_id,
        token
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byType(type, relId, token)
      })
    }
  })
}

export function useCreateComment(appId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment) => {
      const queryKey = queryKeys.comments.byApp(appId)
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<InfiniteData<CommentsPage>>(queryKey)

      if (previous) {
        const optimistic: Comment = {
          id: -Date.now(),
          parent_id: newComment.parent_id ?? null,
          user_id: 0,
          app_id: newComment.app_id,
          comment: newComment.comment,
          rating: 0,
          alias: "You",
          is_admin: false,
          children: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const updatePages = (pages: CommentsPage[]): CommentsPage[] => {
          if (newComment.parent_id) {
            return pages.map((page) => ({
              ...page,
              items: page.items.map((c) =>
                c.id === newComment.parent_id
                  ? { ...c, children: [...c.children, optimistic] }
                  : c
              )
            }))
          }
          // Prepend to the first page
          return pages.map((page, i) =>
            i === 0
              ? {
                  ...page,
                  items: [optimistic, ...page.items],
                  totalComments: page.totalComments + 1
                }
              : page
          )
        }

        queryClient.setQueryData<InfiniteData<CommentsPage>>(queryKey, {
          ...previous,
          pages: updatePages(previous.pages)
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.comments.byApp(appId),
          context.previous
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byApp(appId)
      })
    }
  })
}

export function useUpdateComment(appId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      updateComment(id, { comment }),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byApp(appId)
      })
    }
  })
}

export function useUpdateCommentByType(
  type: string,
  relId: number,
  token?: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      updateComment(id, { comment }, token),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byType(type, relId, token)
      })
    }
  })
}

export function useDeleteCommentByType(
  type: string,
  relId: number,
  token?: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteComment(id, token),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byType(type, relId, token)
      })
    }
  })
}

export function useDeleteComment(appId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onMutate: async (id) => {
      const queryKey = queryKeys.comments.byApp(appId)
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<InfiniteData<CommentsPage>>(queryKey)

      if (previous) {
        queryClient.setQueryData<InfiniteData<CommentsPage>>(queryKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: page.items
              .filter((c) => c.id !== id)
              .map((c) => ({
                ...c,
                children: c.children.filter((ch) => ch.id !== id)
              }))
          }))
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.comments.byApp(appId),
          context.previous
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byApp(appId)
      })
    }
  })
}

export function useVoteCommentByType(
  type: string,
  relId: number,
  token?: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      direction
    }: {
      id: number
      direction: "up" | "down" | null
    }) =>
      direction === null
        ? deleteVote(id, token)
        : voteComment(id, direction, token),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byType(type, relId, token)
      })
    }
  })
}

export function useVoteComment(appId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      direction
    }: {
      id: number
      direction: "up" | "down" | null
    }) => (direction === null ? deleteVote(id) : voteComment(id, direction)),

    onMutate: async ({ id, direction }) => {
      const queryKey = queryKeys.comments.byApp(appId)
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<InfiniteData<CommentsPage>>(queryKey)

      if (previous) {
        const patch = (list: Comment[]): Comment[] =>
          list.map((c) => {
            const children = patch(c.children)
            if (c.id !== id) return { ...c, children }

            const cur = c.uservote
            let rating = c.rating
            let uservote: 1 | 0 | undefined

            if (direction === null) {
              if (cur === 1) rating -= 1
              else if (cur === 0) rating += 1
              uservote = undefined
            } else if (direction === "up") {
              if (cur === 0) {
                rating += 2
                uservote = 1
              } else {
                rating += 1
                uservote = 1
              }
            } else {
              if (cur === 1) {
                rating -= 2
                uservote = 0
              } else {
                rating -= 1
                uservote = 0
              }
            }

            return { ...c, rating, uservote, children }
          })

        queryClient.setQueryData<InfiniteData<CommentsPage>>(queryKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: patch(page.items)
          }))
        })
      }

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.comments.byApp(appId),
          context.previous
        )
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byApp(appId)
      })
    }
  })
}
