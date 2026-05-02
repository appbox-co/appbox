import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"

export interface Comment {
  id: number
  parent_id: number | null
  user_id: number
  app_id: number
  comment: string
  rating: number
  alias: string
  is_admin: boolean
  /** Current user's vote: 1 = upvoted, 0 = downvoted, absent = no vote */
  uservote?: 1 | 0
  children: Comment[]
  created_at: string
  updated_at: string
}

export interface CommentsPage {
  items: Comment[]
  totalComments: number
  hasMore: boolean
}

export type CommentSortOrder = "rating" | "newest" | "oldest"

export interface CreateCommentInput {
  app_id: number
  comment: string
  parent_id?: number
  optimisticAuthor?: {
    user_id: number
    alias: string
    is_admin: boolean
  }
}

const PAGE_SIZE = 25

const ORDER_BY_PARAM: Record<CommentSortOrder, string> = {
  rating: "-rating",
  newest: "-created_at",
  oldest: "created_at"
}

/**
 * Backend: GET /v1/comments?type=app&relid={appId}&page={page}&limit={limit}
 * Returns { items, totalCount, totalComments }
 */
export async function getComments(
  appId: number,
  page = 1,
  sortOrder: CommentSortOrder = "rating"
): Promise<CommentsPage> {
  const res = await apiGet<{
    items: Comment[]
    totalCount: number
    totalComments: number
  }>("comments", {
    params: {
      type: "app",
      relid: String(appId),
      page: String(page),
      limit: String(PAGE_SIZE),
      orderby: ORDER_BY_PARAM[sortOrder]
    }
  })
  const items = Array.isArray(res) ? res : (res.items ?? [])
  const totalComments = Array.isArray(res)
    ? items.length
    : (res.totalComments ?? items.length)
  return {
    items,
    totalComments,
    hasMore: items.length === PAGE_SIZE
  }
}

/**
 * Backend: GET /v1/comments?type={type}&relid={relId}&page=&limit=
 * For abuse reports use type=abuseReportUser, relid=abuseId.
 */
export async function getCommentsByType(
  type: string,
  relId: number,
  page = 1,
  token?: string,
  sortOrder: CommentSortOrder = "rating"
): Promise<CommentsPage> {
  const params: Record<string, string> = {
    type,
    relid: String(relId),
    page: String(page),
    limit: String(PAGE_SIZE),
    orderby: ORDER_BY_PARAM[sortOrder]
  }
  if (token) {
    params.token = token
  }
  const res = await apiGet<{
    items: Comment[]
    totalCount?: number
    totalComments?: number
  }>("comments", {
    params
  })
  const items = Array.isArray(res) ? res : (res.items ?? [])
  const totalComments = Array.isArray(res)
    ? items.length
    : (res.totalComments ?? items.length)
  return {
    items,
    totalComments,
    hasMore: items.length === PAGE_SIZE
  }
}

/**
 * Backend: PUT /v1/comments (uses PUT to create, not POST)
 * Body: { type: "app", relid: appId, comment: text, parent: parentId }
 */
export async function createComment(data: CreateCommentInput): Promise<Comment> {
  return apiPut<Comment>("comments", {
    type: "app",
    relid: data.app_id,
    comment: data.comment,
    parent: data.parent_id || 0
  })
}

/**
 * Backend: PUT /v1/comments — create with type and relid (e.g. abuseReportUser, abuseId).
 */
export async function createCommentByType(data: {
  type: string
  relid: number
  comment: string
  parent_id?: number
  token?: string
}): Promise<Comment> {
  const params: Record<string, string> | undefined = data.token
    ? { token: data.token }
    : undefined
  return apiPut<Comment>(
    "comments",
    {
      type: data.type,
      relid: data.relid,
      comment: data.comment,
      parent: data.parent_id ?? 0
    },
    { params }
  )
}

/**
 * Backend: POST /v1/comments/{id} (uses POST to update, not PUT)
 */
export async function updateComment(
  id: number,
  data: { comment: string },
  token?: string
): Promise<Comment> {
  const params: Record<string, string> | undefined = token
    ? { token }
    : undefined
  return apiPost<Comment>(`comments/${id}`, data, { params })
}

export async function deleteComment(id: number, token?: string): Promise<void> {
  const params: Record<string, string> | undefined = token
    ? { token }
    : undefined
  return apiDelete(`comments/${id}`, { params })
}

/**
 * Backend: PUT /v1/vote/Comments/{id}/{value}
 * value: 1 = upvote, 0 = downvote
 */
export async function voteComment(
  id: number,
  direction: "up" | "down",
  token?: string
): Promise<void> {
  const value = direction === "up" ? 1 : 0
  const params: Record<string, string> | undefined = token
    ? { token }
    : undefined
  return apiPut(`vote/Comments/${id}/${value}`, undefined, { params })
}

/**
 * Backend: DELETE /v1/vote/Comments/{id}
 * Removes the current user's vote on a comment.
 */
export async function deleteVote(id: number, token?: string): Promise<void> {
  const params: Record<string, string> | undefined = token
    ? { token }
    : undefined
  return apiDelete(`vote/Comments/${id}`, { params })
}
