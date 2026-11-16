"use client"

import { useMemo, useState } from "react"
import type { CommentSortOrder } from "@/api/comments/comments"
import {
  flattenComments,
  totalCommentCount,
  useComments,
  useCommentsByType,
  useCreateComment,
  useCreateCommentByType,
  useDeleteComment,
  useDeleteCommentByType,
  useUpdateComment,
  useUpdateCommentByType,
  useVoteComment,
  useVoteCommentByType
} from "@/api/comments/hooks/use-comments"
import { useWsSubscribe } from "@/lib/websocket/hooks"
import { useOptionalAuth } from "@/providers/auth-provider"
import { useOptionalWebSocket } from "@/providers/websocket-provider"
import type { Loadable } from "../shared"
import {
  CommentsView,
  DEFAULT_COMMENT_MAX_LENGTH,
  type CommentsData
} from "./comments-view"

/** The source's limits: abuse report conversations take much longer messages. */
const ABUSE_REPORT_COMMENT_MAX_LENGTH = 10000
const ABUSE_REPORT_COMMENT_TYPES = new Set([
  "abuseReportUser",
  "abuseReportComplainant"
])

interface LiveCommentsProps {
  /** An app's comments: pass its id and leave `commentType` and `relId` out. */
  appId?: number
  /**
   * Comments on something other than an app (an abuse report, say): the
   * comment type and the id of the thing commented on.
   */
  commentType?: string
  relId?: number
  title?: string
  enableVoting?: boolean
  enableReplies?: boolean
}

/**
 * Comments wired to the same queries, mutations and WebSocket channel as
 * `Comments` in components/dashboard/comments.tsx: an app's by default, or
 * those of a given type and related id.
 */
export function LiveComments({
  appId = 0,
  commentType,
  relId = 0,
  title,
  enableVoting,
  enableReplies
}: LiveCommentsProps) {
  const auth = useOptionalAuth()
  const ws = useOptionalWebSocket()
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("rating")

  // As in the source: by type when both are given, otherwise by app, and an
  // id that is not positive disables the queries of the mode not in use.
  const byType = Boolean(commentType && relId > 0)
  const id = !byType && appId > 0 ? appId : 0
  const type = byType ? (commentType ?? "") : ""
  const typeRelId = byType ? relId : 0

  const queryApp = useComments(id, sortOrder)
  const queryByType = useCommentsByType(type, typeRelId, undefined, sortOrder)
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = byType ? queryByType : queryApp

  const createByApp = useCreateComment(id, sortOrder)
  const createByType = useCreateCommentByType(type, typeRelId)
  const updateByApp = useUpdateComment(id)
  const updateByType = useUpdateCommentByType(type, typeRelId)
  const deleteByApp = useDeleteComment(id)
  const deleteByType = useDeleteCommentByType(type, typeRelId)
  const voteByApp = useVoteComment(id)
  const voteByType = useVoteCommentByType(type, typeRelId)

  const updateComment = byType ? updateByType : updateByApp
  const deleteComment = byType ? deleteByType : deleteByApp
  const voteComment = byType ? voteByType : voteByApp

  useWsSubscribe(
    byType ? `comment:${type}:${typeRelId}` : id > 0 ? `comment:${id}` : null,
    ws ?? undefined
  )

  const items = useMemo(() => flattenComments(data), [data])
  const total = totalCommentCount(data)

  // A failed refresh or further page keeps the comments already loaded on
  // screen under the error, so only a failure with nothing loaded is "error".
  const comments: Loadable<CommentsData> = isLoading
    ? { status: "loading" }
    : error && !data
      ? { status: "error" }
      : {
          status: "ready",
          data: {
            items,
            total,
            hasMore: hasNextPage,
            lastFetchFailed: Boolean(error)
          }
        }

  return (
    <CommentsView
      comments={comments}
      currentUser={
        auth ? { id: auth.user.id, canModerate: auth.isAdmin } : null
      }
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      onPost={({ comment, parentId }) =>
        byType
          ? createByType.mutateAsync({ comment, parent_id: parentId })
          : createByApp.mutateAsync({
              app_id: id,
              comment,
              parent_id: parentId,
              optimisticAuthor: auth
                ? {
                    user_id: auth.user.id,
                    alias:
                      auth.user.alias || auth.user.firstname || auth.user.email,
                    is_admin: auth.isAdmin
                  }
                : undefined
            })
      }
      onEdit={(commentId, comment) =>
        updateComment.mutateAsync({ id: commentId, comment })
      }
      onDelete={(commentId) => deleteComment.mutateAsync(commentId)}
      onVote={(commentId, direction) =>
        voteComment.mutateAsync({ id: commentId, direction })
      }
      loadingMore={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      title={title}
      enableVoting={enableVoting}
      enableReplies={enableReplies}
      maxLength={
        byType && ABUSE_REPORT_COMMENT_TYPES.has(type)
          ? ABUSE_REPORT_COMMENT_MAX_LENGTH
          : DEFAULT_COMMENT_MAX_LENGTH
      }
    />
  )
}
