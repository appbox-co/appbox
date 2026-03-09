"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import {
  Edit2,
  EllipsisVertical,
  Loader2,
  MessageSquare,
  Reply,
  Send,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Trash2
} from "lucide-react"
import type { Comment } from "@/api/comments/comments"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useWsSubscribe } from "@/lib/websocket/hooks"
import { useOptionalAuth } from "@/providers/auth-provider"
import { useOptionalWebSocket } from "@/providers/websocket-provider"

/** When set, comments use type+relId (e.g. abuseReportUser + abuseId) instead of appId. */
type CommentContextValue =
  | { mode: "app"; appId: number }
  | { mode: "byType"; type: string; relId: number; token?: string }

const CommentContext = createContext<CommentContextValue>({
  mode: "app",
  appId: 0
})

interface CommentsProps {
  /** App comments: pass appId (and omit commentType/relId). */
  appId?: number
  /** By-type comments (e.g. abuse): pass commentType + relId. WS channel: comment:{commentType}:{relId}. */
  commentType?: string
  relId?: number
  enableVoting?: boolean
  enableReplies?: boolean
  /** Card title (default "Comments"). */
  title?: string
  /** Optional token for public by-type comment access (e.g. abuse complainant). */
  authToken?: string
}

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const AVATAR_COLORS = [
  "bg-rose-500/15 text-rose-500",
  "bg-orange-500/15 text-orange-500",
  "bg-amber-500/15 text-amber-500",
  "bg-yellow-500/15 text-yellow-600",
  "bg-lime-500/15 text-lime-600",
  "bg-green-500/15 text-green-600",
  "bg-teal-500/15 text-teal-500",
  "bg-cyan-500/15 text-cyan-500",
  "bg-sky-500/15 text-sky-500",
  "bg-blue-500/15 text-blue-500",
  "bg-indigo-500/15 text-indigo-500",
  "bg-violet-500/15 text-violet-500",
  "bg-purple-500/15 text-purple-500",
  "bg-fuchsia-500/15 text-fuchsia-500",
  "bg-pink-500/15 text-pink-500"
]

function UserAvatar({
  alias,
  isAdmin,
  userId
}: {
  alias: string | null
  isAdmin: boolean
  userId: number
}) {
  const initials = (alias || "Anonymous")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const colorClass = isAdmin
    ? "bg-primary/15 text-primary"
    : AVATAR_COLORS[userId % AVATAR_COLORS.length]

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        colorClass
      )}
    >
      {initials}
    </div>
  )
}

interface CommentFormProps {
  parentId?: number
  onCancel?: () => void
  placeholder?: string
}

function CommentForm({
  parentId,
  onCancel,
  placeholder
}: CommentFormProps) {
  const ctx = useContext(CommentContext)
  const [text, setText] = useState("")
  const createByApp = useCreateComment(ctx.mode === "app" ? ctx.appId : 0)
  const createByType = useCreateCommentByType(
    ctx.mode === "byType" ? ctx.type : "",
    ctx.mode === "byType" ? ctx.relId : 0,
    ctx.mode === "byType" ? ctx.token : undefined
  )
  const createComment = ctx.mode === "app" ? createByApp : createByType

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (ctx.mode === "app") {
      createByApp.mutate(
        { app_id: ctx.appId, comment: trimmed, parent_id: parentId },
        { onSuccess: () => setText("") }
      )
    } else {
      createByType.mutate(
        { comment: trimmed, parent_id: parentId },
        { onSuccess: () => setText("") }
      )
    }
  }, [text, ctx, parentId, createByApp, createByType])

  return (
    <div className="flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Write a comment..."}
        rows={2}
        className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            onCancel?.()
            return
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
      <div className="flex flex-col gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          disabled={!text.trim() || createComment.isPending}
          onClick={handleSubmit}
        >
          {createComment.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
        {onCancel && (
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground"
            onClick={onCancel}
          >
            &times;
          </Button>
        )}
      </div>
    </div>
  )
}

// Walk the full comment tree and build a map of alias → ordered unique user_ids.
// Used to detect when multiple distinct users share the same display name.
function buildAliasUserMap(comments: Comment[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  function walk(c: Comment) {
    const key = c.alias || ""
    const ids = map.get(key) ?? []
    if (!ids.includes(c.user_id)) map.set(key, [...ids, c.user_id])
    c.children?.forEach(walk)
  }
  comments.forEach(walk)
  return map
}

// Returns the display name for a commenter:
//   - No alias → "Anonymous"
//   - Unique alias → alias as-is
//   - Duplicate alias (different user_ids) → "alias #1", "alias #2", …
function resolveDisplayAlias(
  alias: string | null,
  userId: number,
  aliasMap: Map<string, number[]>
): string {
  const key = alias || ""
  const displayName = alias || "Anonymous"
  const ids = aliasMap.get(key) ?? []
  if (ids.length <= 1) return displayName
  const rank = ids.indexOf(userId) + 1
  return `${displayName} #${rank}`
}

interface CommentItemProps {
  comment: Comment
  currentUserId: number
  isAdmin: boolean
  enableVoting: boolean
  enableReplies: boolean
  aliasMap: Map<string, number[]>
  depth?: number
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  enableVoting,
  enableReplies,
  aliasMap,
  depth = 0
}: CommentItemProps) {
  const ctx = useContext(CommentContext)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.comment)
  const [isReplying, setIsReplying] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateByApp = useUpdateComment(ctx.mode === "app" ? ctx.appId : 0)
  const updateByType = useUpdateCommentByType(
    ctx.mode === "byType" ? ctx.type : "",
    ctx.mode === "byType" ? ctx.relId : 0,
    ctx.mode === "byType" ? ctx.token : undefined
  )
  const deleteByApp = useDeleteComment(ctx.mode === "app" ? ctx.appId : 0)
  const deleteByType = useDeleteCommentByType(
    ctx.mode === "byType" ? ctx.type : "",
    ctx.mode === "byType" ? ctx.relId : 0,
    ctx.mode === "byType" ? ctx.token : undefined
  )
  const voteByApp = useVoteComment(ctx.mode === "app" ? ctx.appId : 0)
  const voteByType = useVoteCommentByType(
    ctx.mode === "byType" ? ctx.type : "",
    ctx.mode === "byType" ? ctx.relId : 0,
    ctx.mode === "byType" ? ctx.token : undefined
  )

  const updateComment = ctx.mode === "app" ? updateByApp : updateByType
  const deleteCommentMutation = ctx.mode === "app" ? deleteByApp : deleteByType
  const voteCommentMutation = ctx.mode === "app" ? voteByApp : voteByType

  const isOwn = comment.user_id === currentUserId
  const canModify = isOwn || isAdmin

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === comment.comment) {
      setIsEditing(false)
      return
    }
    updateComment.mutate(
      { id: comment.id, comment: trimmed },
      { onSuccess: () => setIsEditing(false) }
    )
  }, [editText, comment.id, comment.comment, updateComment])

  const handleDelete = useCallback(() => {
    deleteCommentMutation.mutate(comment.id, {
      onSuccess: () => setShowDeleteConfirm(false)
    })
  }, [comment.id, deleteCommentMutation])

  const hasChildren = (comment.children?.length ?? 0) > 0
  const replyCount = comment.children?.length ?? 0
  const displayAlias = resolveDisplayAlias(
    comment.alias,
    comment.user_id,
    aliasMap
  )

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((c) => {
      if (!c) {
        setIsEditing(false)
        setIsReplying(false)
        setShowDeleteConfirm(false)
      }
      return !c
    })
  }, [])

  return (
    <div className="pt-2">
      {/* Main comment row: avatar | content */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="shrink-0 focus:outline-none"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
          >
            <UserAvatar
              alias={comment.alias}
              isAdmin={comment.is_admin}
              userId={comment.user_id}
            />
          </button>
          {!isCollapsed && hasChildren && (
            <div
              className="mt-1 w-0.5 flex-1 cursor-pointer bg-border/50 transition-colors hover:bg-border"
              onClick={handleToggleCollapse}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              className="text-sm font-medium text-foreground hover:underline focus:outline-none"
              onClick={handleToggleCollapse}
            >
              {displayAlias}
            </button>
            {!!comment.is_admin && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <Shield className="size-2.5" />
                Admin
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
            {isCollapsed && hasChildren && (
              <span className="text-xs text-muted-foreground">
                {`— ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
              </span>
            )}
          </div>

          {!isCollapsed && isEditing ? (
            <div className="mt-1 flex gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setIsEditing(false)
                    setEditText(comment.comment)
                  } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveEdit()
                  }
                }}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  disabled={updateComment.isPending}
                  onClick={handleSaveEdit}
                >
                  {updateComment.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(comment.comment)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : !isCollapsed ? (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">
              {comment.comment}
            </p>
          ) : null}

          {!isCollapsed && !isEditing && (
            <div className="mt-1 flex items-center gap-1">
              {enableVoting && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="group size-7"
                    onClick={() => {
                      if (voteCommentMutation.isPending) return
                      voteCommentMutation.mutate({
                        id: comment.id,
                        direction: comment.uservote === 1 ? null : "up"
                      })
                    }}
                  >
                    <ThumbsUp
                      className={cn(
                        "size-3.5 transition-colors",
                        comment.uservote === 1
                          ? "text-green-500"
                          : "text-foreground/40 group-hover:text-foreground/60"
                      )}
                    />
                  </Button>
                  <span
                    className={cn(
                      "min-w-[1.25rem] text-center text-xs font-medium tabular-nums",
                      comment.rating > 0 && "text-green-500",
                      comment.rating < 0 && "text-destructive",
                      comment.rating === 0 && "text-muted-foreground"
                    )}
                  >
                    {comment.rating}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="group size-7"
                    onClick={() => {
                      if (voteCommentMutation.isPending) return
                      voteCommentMutation.mutate({
                        id: comment.id,
                        direction: comment.uservote === 0 ? null : "down"
                      })
                    }}
                  >
                    <ThumbsDown
                      className={cn(
                        "size-3.5 transition-colors",
                        comment.uservote === 0
                          ? "text-destructive"
                          : "text-foreground/40 group-hover:text-foreground/60"
                      )}
                    />
                  </Button>
                </>
              )}
              {enableReplies && depth < 2 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="size-3.5" />
                  Reply
                </Button>
              )}
              {canModify && (
                <>
                  {showDeleteConfirm ? (
                    <div className="ml-2 flex items-center gap-1 text-xs">
                      <span className="text-destructive">Delete?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-destructive"
                        disabled={deleteCommentMutation.isPending}
                        onClick={handleDelete}
                      >
                        {deleteCommentMutation.isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Yes"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7">
                          <EllipsisVertical className="size-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        {isOwn && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditText(comment.comment)
                              setIsEditing(true)
                            }}
                          >
                            <Edit2 className="mr-2 size-3.5" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          )}

          {!isCollapsed && isReplying && (
            <div className="mt-2">
              <CommentForm
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${displayAlias}...`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Children — outside the main flex row so the parent line
          only covers body/actions. Per-child segments handle threading. */}
      {!isCollapsed && hasChildren && (
        <div className="pl-[15px]">
          {comment.children.map((child, i) => {
            const isLast = i === comment.children.length - 1
            return (
              <div key={child.id} className="relative pl-7">
                <div
                  className={cn(
                    "absolute left-0 top-0 w-0.5 bg-border/50",
                    isLast ? "h-6" : "h-full"
                  )}
                />
                <div className="absolute left-0 top-6 h-0.5 w-7 bg-border/50" />
                <CommentItem
                  comment={child}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  enableVoting={enableVoting}
                  enableReplies={enableReplies}
                  aliasMap={aliasMap}
                  depth={depth + 1}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type SortOrder = "rating" | "newest" | "oldest"

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "rating", label: "Top" },
  { value: "newest", label: "New" },
  { value: "oldest", label: "Old" }
]

function sortComments(comments: Comment[], order: SortOrder): Comment[] {
  const sorted = [...comments].sort((a, b) => {
    if (order === "rating")
      return (
        b.rating - a.rating ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (order === "newest")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
  return sorted.map((c) => ({
    ...c,
    children: sortComments(c.children, order)
  }))
}

export function Comments({
  appId = 0,
  commentType,
  relId = 0,
  enableVoting = true,
  enableReplies = true,
  title,
  authToken
}: CommentsProps) {
  const auth = useOptionalAuth()
  const userId = auth?.user.id ?? -1
  const isAdmin = auth?.isAdmin ?? false
  const ws = useOptionalWebSocket()
  const [sortOrder, setSortOrder] = useState<SortOrder>("rating")
  const sentinelRef = useRef<HTMLDivElement>(null)

  const byType = Boolean(commentType && relId > 0)
  const ctx: CommentContextValue = byType
    ? { mode: "byType", type: commentType!, relId, token: authToken }
    : { mode: "app", appId: appId > 0 ? appId : 0 }

  const queryApp = useComments(ctx.mode === "app" ? ctx.appId : 0)
  const queryByType = useCommentsByType(
    ctx.mode === "byType" ? ctx.type : "",
    ctx.mode === "byType" ? ctx.relId : 0,
    ctx.mode === "byType" ? ctx.token : undefined
  )
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = byType ? queryByType : queryApp

  const comments = useMemo(() => flattenComments(data), [data])
  const total = totalCommentCount(data)

  const sortedComments = useMemo(
    () => sortComments(comments, sortOrder),
    [comments, sortOrder]
  )

  const aliasMap = useMemo(() => buildAliasUserMap(comments), [comments])

  const wsChannel =
    ctx.mode === "app" && ctx.appId > 0
      ? `comment:${ctx.appId}`
      : ctx.mode === "byType"
        ? `comment:${ctx.type}:${ctx.relId}`
        : null
  useWsSubscribe(wsChannel, ws ?? undefined)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const cardTitle = title ?? "Comments"

  return (
    <CommentContext.Provider value={ctx}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" />
              {cardTitle}
              {total != null && total > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({total})
                </span>
              )}
            </CardTitle>
            {comments.length > 1 && (
              <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortOrder(opt.value)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      sortOrder === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CommentForm />

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Failed to load comments. Please try again.
            </div>
          )}

          {!isLoading && !error && comments.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}

          {sortedComments.length > 0 && (
            <div className="flex flex-col">
              {sortedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={userId}
                  isAdmin={isAdmin}
                  enableVoting={enableVoting}
                  enableReplies={enableReplies}
                  aliasMap={aliasMap}
                />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </CommentContext.Provider>
  )
}
