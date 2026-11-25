"use client"

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react"
import {
  Badge,
  Banner,
  Button,
  cn,
  Dialog,
  DropdownMenu,
  Empty,
  InputArea,
  LayerCard,
  Loader,
  Select,
  SkeletonLine,
  Tooltip
} from "@cloudflare/kumo"
import {
  ArrowBendUpLeftIcon,
  ChatsCircleIcon,
  DotsThreeVerticalIcon,
  PaperPlaneRightIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShieldIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
  WarningCircleIcon,
  type Icon
} from "@phosphor-icons/react"
import type { Comment, CommentSortOrder } from "@/api/comments/comments"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { useRelativeTime } from "../short-date"

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

/** The signed-in user, as far as comments are concerned. */
export interface CommentsViewer {
  id: number
  /** May delete other people's comments. Editing stays limited to the author. */
  canModerate: boolean
}

export interface CommentsData {
  /**
   * Top-level comments loaded so far, with replies nested in `children`. Any
   * order: the view sorts every level by `sortOrder`.
   */
  items: Comment[]
  /** Comment count reported by the API. Shown beside the title when above 0. */
  total?: number
  /** More pages can be requested with `onLoadMore`. */
  hasMore?: boolean
  /**
   * The latest request failed (a refresh or a further page) and `items` is
   * what had loaded before it. Shows the error above the list.
   */
  lastFetchFailed?: boolean
}

export interface CommentDraft {
  /** Trimmed and within `maxLength`. */
  comment: string
  /** Set when replying. */
  parentId?: number
}

export type CommentVoteDirection = "up" | "down" | null

/**
 * The view shows an action in progress until its promise settles. A rejection
 * counts as failure: the draft, editor or confirmation stays open.
 */
export interface CommentsViewProps {
  comments: Loadable<CommentsData>
  /** Null when nobody is signed in. */
  currentUser: CommentsViewer | null
  sortOrder: CommentSortOrder
  onSortChange: (order: CommentSortOrder) => void
  onPost: (draft: CommentDraft) => Promise<unknown>
  /** `comment` is trimmed, within `maxLength` and differs from the original. */
  onEdit: (id: number, comment: string) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  /** `null` withdraws the current user's vote. */
  onVote: (id: number, direction: CommentVoteDirection) => Promise<unknown>
  /** A further page is being fetched. */
  loadingMore?: boolean
  /**
   * Called when the end of the list is in view and `hasMore` is set. The check
   * runs again whenever this function changes, so pass a stable one.
   */
  onLoadMore?: () => void
  title?: string
  enableVoting?: boolean
  enableReplies?: boolean
  /** Longest comment accepted, in characters. */
  maxLength?: number
}

/* -------------------------------------------------------------------------- */
/*  Logic carried over from components/dashboard/comments.tsx                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_COMMENT_MAX_LENGTH = 500

/** Replies nested this deep start folded behind a "more replies" control. */
const COLLAPSE_REPLIES_AT_DEPTH = 2

const SORT_OPTIONS: { value: CommentSortOrder; label: string }[] = [
  { value: "rating", label: "Top" },
  { value: "newest", label: "New" },
  { value: "oldest", label: "Old" }
]

/**
 * Copy that only exists in this design. The source confirmed a delete inline
 * ("Delete? Yes / No") and had no label on its edit field.
 */
const COPY = {
  deleteTitle: "Delete comment?",
  editLabel: "Edit comment"
} as const

function sortComments(comments: Comment[], order: CommentSortOrder): Comment[] {
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

function remainingTone(remaining: number, maxLength: number): string {
  if (remaining <= 0) return "text-kumo-danger"
  if (remaining <= maxLength * 0.1) return "text-kumo-warning"
  return "text-kumo-subtle"
}

function ratingTone(rating: number): string {
  if (rating > 0) return "text-kumo-success"
  if (rating < 0) return "text-kumo-danger"
  return "text-kumo-subtle"
}

function replies(count: number) {
  return count === 1 ? "reply" : "replies"
}

/**
 * Tracks an action the way the source's per-form and per-comment mutations
 * did: `pending` follows the latest call, and only that call reports success.
 */
function useAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<unknown>
) {
  const [pending, setPending] = useState(false)
  const latest = useRef(0)

  const run = (args: Args, onSuccess?: () => void) => {
    const call = ++latest.current
    setPending(true)
    action(...args).then(
      () => {
        if (latest.current !== call) return
        setPending(false)
        onSuccess?.()
      },
      () => {
        if (latest.current === call) setPending(false)
      }
    )
  }

  return { pending, run }
}

/* -------------------------------------------------------------------------- */
/*  Shared state for one comment section                                       */
/* -------------------------------------------------------------------------- */

interface ThreadContextValue {
  currentUserId: number
  canModerate: boolean
  enableVoting: boolean
  enableReplies: boolean
  maxLength: number
  aliasMap: Map<string, number[]>
  onPost: CommentsViewProps["onPost"]
  onEdit: CommentsViewProps["onEdit"]
  onVote: CommentsViewProps["onVote"]
  onRequestDelete: (comment: Comment) => void
}

const ThreadContext = createContext<ThreadContextValue | null>(null)

function useThread() {
  const thread = useContext(ThreadContext)
  if (!thread) throw new Error("useThread must be used within CommentsView")
  return thread
}

/* -------------------------------------------------------------------------- */
/*  Draft field                                                                */
/* -------------------------------------------------------------------------- */

/** Text area with the remaining-characters counter and its actions. */
function DraftField({
  value,
  onChange,
  placeholder,
  label,
  submitLabel,
  submitIcon,
  submitting,
  submitDisabled,
  onSubmit,
  onEscape,
  onCancel
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible name, for a field without a placeholder. */
  label?: string
  submitLabel: string
  submitIcon?: Icon
  submitting: boolean
  submitDisabled: boolean
  onSubmit: () => void
  onEscape: () => void
  /** Adds a Cancel button. */
  onCancel?: () => void
}) {
  const { maxLength } = useThread()
  const counterId = useId()
  const remaining = maxLength - value.length

  return (
    <div className="grid gap-2">
      <InputArea
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        aria-describedby={counterId}
        rows={3}
        maxLength={maxLength}
        className="block min-h-24 w-full resize-y"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            onEscape()
            return
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            onSubmit()
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          id={counterId}
          className={cn(
            "text-sm tabular-nums",
            remainingTone(remaining, maxLength)
          )}
        >
          {remaining.toLocaleString()} characters remaining
        </p>
        <div className="flex items-center gap-2">
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button
            variant="primary"
            icon={submitIcon}
            loading={submitting}
            disabled={submitDisabled || remaining < 0}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CommentForm({
  parentId,
  onCancel,
  placeholder = "Write a comment...",
  submitLabel = "Post comment"
}: {
  parentId?: number
  onCancel?: () => void
  placeholder?: string
  submitLabel?: string
}) {
  const { maxLength, onPost } = useThread()
  const [text, setText] = useState("")
  const post = useAction(onPost)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > maxLength) return
    post.run([{ comment: trimmed, parentId }], () => setText(""))
  }

  return (
    <DraftField
      value={text}
      onChange={setText}
      placeholder={placeholder}
      submitLabel={submitLabel}
      submitIcon={PaperPlaneRightIcon}
      submitting={post.pending}
      submitDisabled={!text.trim()}
      onSubmit={submit}
      onEscape={() => onCancel?.()}
      onCancel={onCancel}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Comment                                                                    */
/* -------------------------------------------------------------------------- */

function UserAvatar({
  alias,
  isAdmin
}: {
  alias: string | null
  isAdmin: boolean
}) {
  const initials = (alias || "Anonymous")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ring ring-kumo-hairline",
        isAdmin
          ? "bg-kumo-info-tint text-kumo-info"
          : "bg-kumo-tint text-kumo-subtle"
      )}
    >
      {initials}
    </span>
  )
}

/**
 * Connector from a comment's thread line to one of its replies. The reply's
 * wrapper is `relative ps-7 pt-3`, which puts the elbow level with the
 * middle of the reply's avatar.
 */
function ThreadConnector({ last }: { last: boolean }) {
  return (
    <>
      {!last && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-px bg-kumo-line"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute start-0 top-0 h-7 w-5 rounded-es-lg border-s border-b border-kumo-line"
      />
    </>
  )
}

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand"

function CommentItem({
  comment,
  depth = 0
}: {
  comment: Comment
  depth?: number
}) {
  const {
    currentUserId,
    canModerate,
    enableVoting,
    enableReplies,
    maxLength,
    aliasMap,
    onEdit,
    onVote,
    onRequestDelete
  } = useThread()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.comment)
  const [isReplying, setIsReplying] = useState(false)
  const [showDeepReplies, setShowDeepReplies] = useState(false)
  const save = useAction(onEdit)
  const vote = useAction(onVote)
  const relativeTime = useRelativeTime()

  const isOwn = comment.user_id === currentUserId
  const canModify = isOwn || canModerate

  const replyCount = comment.children?.length ?? 0
  const hasChildren = replyCount > 0
  const showChildReplies = depth < COLLAPSE_REPLIES_AT_DEPTH || showDeepReplies
  const displayAlias = resolveDisplayAlias(
    comment.alias,
    comment.user_id,
    aliasMap
  )

  const upvoted = comment.uservote === 1
  const downvoted = comment.uservote === 0
  const upvoteLabel = upvoted ? "Remove upvote" : "Upvote comment"
  const downvoteLabel = downvoted ? "Remove downvote" : "Downvote comment"

  const toggleCollapse = () => {
    if (!isCollapsed) {
      setIsEditing(false)
      setIsReplying(false)
      setShowDeepReplies(false)
    }
    setIsCollapsed(!isCollapsed)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditText(comment.comment)
  }

  const saveEdit = () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === comment.comment) {
      setIsEditing(false)
      return
    }
    if (trimmed.length > maxLength) return
    save.run([comment.id, trimmed], () => setIsEditing(false))
  }

  const castVote = (direction: "up" | "down", withdraw: boolean) => {
    if (vote.pending) return
    vote.run([comment.id, withdraw ? null : direction])
  }

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-col">
          <button
            type="button"
            className={cn("cursor-pointer rounded-full", focusRing)}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
            aria-expanded={!isCollapsed}
          >
            <UserAvatar alias={comment.alias} isAdmin={!!comment.is_admin} />
          </button>
          {!isCollapsed && hasChildren && (
            <button
              type="button"
              aria-label="Collapse comment thread"
              className="group mt-1 flex w-8 flex-1 cursor-pointer outline-none"
              onClick={toggleCollapse}
            >
              <span className="ms-[15px] w-px bg-kumo-line group-hover:bg-kumo-brand group-focus-visible:bg-kumo-brand" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-0.5">
            <button
              type="button"
              className={cn(
                "cursor-pointer rounded-sm font-medium text-kumo-default hover:underline",
                focusRing
              )}
              onClick={toggleCollapse}
            >
              {displayAlias}
            </button>
            {!!comment.is_admin && (
              <Badge variant="info" icon={ShieldIcon}>
                Admin
              </Badge>
            )}
            <span className="text-sm text-kumo-subtle tabular-nums">
              {relativeTime(comment.created_at)}
            </span>
            {isCollapsed && hasChildren && (
              <span className="text-sm text-kumo-subtle">
                {`${replyCount} ${replies(replyCount)}`}
              </span>
            )}
          </div>

          {!isCollapsed &&
            (isEditing ? (
              <div className="mt-1">
                <DraftField
                  value={editText}
                  onChange={setEditText}
                  label={COPY.editLabel}
                  submitLabel="Save"
                  submitting={save.pending}
                  submitDisabled={false}
                  onSubmit={saveEdit}
                  onEscape={cancelEdit}
                  onCancel={cancelEdit}
                />
              </div>
            ) : (
              <p className="wrap-break-word whitespace-pre-wrap">
                {comment.comment}
              </p>
            ))}

          {!isCollapsed &&
            !isEditing &&
            (enableVoting || enableReplies || canModify) && (
              <div className="-ms-1.5 mt-1 flex flex-wrap items-center gap-1">
                {enableVoting && (
                  <>
                    <Tooltip
                      content={upvoteLabel}
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          shape="square"
                          aria-label={upvoteLabel}
                          icon={
                            <ThumbsUpIcon
                              size={14}
                              weight={upvoted ? "fill" : "regular"}
                              className={
                                upvoted
                                  ? "text-kumo-success"
                                  : "text-kumo-subtle"
                              }
                            />
                          }
                          onClick={() => castVote("up", upvoted)}
                        />
                      }
                    />
                    <span
                      className={cn(
                        "min-w-5 text-center text-sm font-medium tabular-nums",
                        ratingTone(comment.rating)
                      )}
                    >
                      {comment.rating}
                    </span>
                    <Tooltip
                      content={downvoteLabel}
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          shape="square"
                          aria-label={downvoteLabel}
                          icon={
                            <ThumbsDownIcon
                              size={14}
                              weight={downvoted ? "fill" : "regular"}
                              className={
                                downvoted
                                  ? "text-kumo-danger"
                                  : "text-kumo-subtle"
                              }
                            />
                          }
                          onClick={() => castVote("down", downvoted)}
                        />
                      }
                    />
                  </>
                )}
                {enableReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowBendUpLeftIcon}
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    Reply
                  </Button>
                )}
                {canModify && (
                  <DropdownMenu>
                    <DropdownMenu.Trigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          shape="square"
                          icon={DotsThreeVerticalIcon}
                          aria-label="Comment actions"
                        />
                      }
                    />
                    <DropdownMenu.Content align="end">
                      {isOwn && (
                        <DropdownMenu.Item
                          icon={PencilSimpleIcon}
                          onClick={() => {
                            setEditText(comment.comment)
                            setIsEditing(true)
                          }}
                        >
                          Edit
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item
                        icon={TrashIcon}
                        variant="danger"
                        onClick={() => onRequestDelete(comment)}
                      >
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                )}
              </div>
            )}

          {!isCollapsed && isReplying && (
            <div className="mt-2">
              <CommentForm
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${displayAlias}...`}
                submitLabel="Post reply"
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies sit outside the row above, so its thread line only spans the
          comment itself. Each reply draws its own segment of the line. */}
      {!isCollapsed && hasChildren && (
        <div className="ps-[15px]">
          {showChildReplies ? (
            comment.children.map((child, index) => (
              <div key={child.id} className="relative ps-7 pt-3">
                <ThreadConnector last={index === replyCount - 1} />
                <CommentItem comment={child} depth={depth + 1} />
              </div>
            ))
          ) : (
            <div className="relative ps-7 pt-3">
              <ThreadConnector last />
              <div className="flex h-8 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={PlusIcon}
                  onClick={() => setShowDeepReplies(true)}
                >
                  {`${replyCount} more ${replies(replyCount)}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

const NO_COMMENTS: Comment[] = []

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3"]

function ThreadSkeleton() {
  return (
    <div className="grid gap-5 px-5 py-4">
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="flex gap-3">
          <SkeletonLine className="size-8 shrink-0 rounded-full" />
          <div className="grid flex-1 content-start gap-3 pt-2.5">
            <SkeletonLine className="h-2.5 w-1/4 rounded-full" />
            <SkeletonLine className={cn("h-2.5 rounded-full", width)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadError() {
  return (
    <div className="p-3">
      <Banner
        variant="error"
        icon={<WarningCircleIcon weight="fill" />}
        title="Failed to load comments. Please try again."
      />
    </div>
  )
}

/**
 * Comments on an app: a composer, then the threads. Presentational: the data
 * and every action come in as props (see `Comments` for the wired one).
 */
export function CommentsView({
  comments,
  currentUser,
  sortOrder,
  onSortChange,
  onPost,
  onEdit,
  onDelete,
  onVote,
  loadingMore = false,
  onLoadMore,
  title = "Comments",
  enableVoting = true,
  enableReplies = true,
  maxLength = DEFAULT_COMMENT_MAX_LENGTH
}: CommentsViewProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const data = comments.status === "ready" ? comments.data : undefined
  const items = data?.items ?? NO_COMMENTS
  const total = data?.total
  const hasMore = data?.hasMore ?? false

  const sortedComments = useMemo(
    () => sortComments(items, sortOrder),
    [items, sortOrder]
  )
  const aliasMap = useMemo(() => buildAliasUserMap(items), [items])

  // Infinite scroll, as in the source: fetch the next page whenever the end
  // of the list is in view. Re-observing after each page keeps it going while
  // the sentinel stays visible.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore?.()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  // The comment stays set after the dialog closes, so its exit animation
  // still has content.
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deletion = useAction(onDelete)

  const thread: ThreadContextValue = {
    currentUserId: currentUser?.id ?? -1,
    canModerate: currentUser?.canModerate ?? false,
    enableVoting,
    enableReplies,
    maxLength,
    aliasMap,
    onPost,
    onEdit,
    onVote,
    onRequestDelete: (comment) => {
      setDeleteTarget(comment)
      setDeleteOpen(true)
    }
  }

  return (
    <ThreadContext.Provider value={thread}>
      <LayerCard>
        <LayerCard.Secondary className="justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate">{title}</h2>
            {total != null && total > 0 && (
              <span className="rounded-full bg-kumo-fill px-1.5 text-xs/5 font-normal text-kumo-default tabular-nums">
                {total}
              </span>
            )}
          </div>
          {items.length > 1 && (
            <Select
              aria-label="Sort comments"
              size="sm"
              // Pulled in so the header stays as tall as its text-only siblings.
              className="-my-1 w-20 shrink-0"
              value={sortOrder}
              onValueChange={(value) => {
                if (value) onSortChange(value)
              }}
              renderValue={(value) =>
                SORT_OPTIONS.find((option) => option.value === value)?.label
              }
            >
              {SORT_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          )}
        </LayerCard.Secondary>

        <LayerCard.Primary className="gap-0 divide-y divide-kumo-hairline p-0">
          <div className="px-5 py-4">
            <CommentForm />
          </div>

          {comments.status === "loading" && <ThreadSkeleton />}

          {(comments.status === "error" || data?.lastFetchFailed) && (
            <LoadError />
          )}

          {data && !data.lastFetchFailed && items.length === 0 && (
            <Empty
              className={EMPTY_IN_CARD}
              size="sm"
              icon={<ChatsCircleIcon size={32} />}
              title="No comments yet."
            />
          )}

          {sortedComments.length > 0 && (
            <ul className="list-none divide-y divide-kumo-hairline">
              {sortedComments.map((comment) => (
                <li key={comment.id} className="px-5 py-4">
                  <CommentItem comment={comment} />
                </li>
              ))}
            </ul>
          )}

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader size="sm" />
            </div>
          )}
        </LayerCard.Primary>

        <div ref={sentinelRef} aria-hidden="true" className="-mt-px h-px" />
      </LayerCard>

      <Dialog.Root
        role="alertdialog"
        open={deleteOpen}
        onOpenChange={(open) => {
          // Stays put while the request is in flight.
          if (!deletion.pending) setDeleteOpen(open)
        }}
      >
        <Dialog className="grid gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {COPY.deleteTitle}
            </Dialog.Title>
            <Dialog.Description className="line-clamp-3 wrap-break-word whitespace-pre-wrap text-kumo-subtle">
              {deleteTarget?.comment}
            </Dialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={deletion.pending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deletion.pending}
              onClick={() => {
                if (!deleteTarget) return
                deletion.run([deleteTarget.id], () => setDeleteOpen(false))
              }}
            >
              Delete
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </ThreadContext.Provider>
  )
}
