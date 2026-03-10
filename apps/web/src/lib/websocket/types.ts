/**
 * WebSocket Message Protocol
 *
 * All messages use a standard JSON envelope sent over WebSocket connections.
 * Two separate WS connections may be active:
 * 1. Central (cylo-api): user events, notifications, migration status, global
 * 2. Per-server (cylo-serverapi): job progress, instance state, resource stats
 */

// ── Message Envelope ──

export interface WsMessage<T = unknown> {
  channel: string
  event: string
  data: T
  timestamp: number
}

// ── Client -> Server Messages ──

export interface WsSubscribeMessage {
  action: "subscribe" | "unsubscribe"
  channel: string
}

// ── Channel Types ──

export type WsChannel =
  | `user:${number}`
  | `user:${number}:notifications`
  | `cylo:${number}`
  | `instance:${number}`
  | `app:${number}`
  | `comment:${number}`
  | "global"

// ── Event Data Types (cylo-api) ──

export interface NotificationCreatedData {
  id: number
  user_id: number
  content: string
  type: string
  action: string
  relid: number
  unread: number
  unread_count: number
  created_at: string
}

export interface NotificationUnreadCountData {
  user_id: number
  count: number
}

export interface MigrationProgressData {
  cylo_id: number | string
  user_id: number
  phase: number
  complete_percent: number
  transferred_percent: number
  avg_speed?: string
  ETA: string
  total_sent?: number
  pre_migration_space_used?: number
  reason?: string
  live_migration?: number
}

export interface MigrationCompletedData {
  cylo_id: number
}

export interface CyloQuotaData {
  cylo_id: number
  user_id: number
  space_used: number
  space_total: number
}

export interface CyloThrottleData {
  cylo_id: number
  user_id: number
  throttled: boolean
  rate_mbps: number
}

/** Full comment pushed by the comment.created event */
export interface CommentCreatedData {
  id: number
  parent_id: number | null
  user_id: number | null
  app_id: number
  comment: string
  rating: number
  alias: string
  is_admin: boolean
  children: CommentCreatedData[]
  created_at: string
  updated_at: string
  type: string
}

/** Partial update pushed by the comment.updated event */
export interface CommentUpdatedData {
  comment_id: number
  app_id: number
  user_id: number | null
  comment: string
  updated_at: string
  type: string
}

/** Identifiers pushed by the comment.deleted event */
export interface CommentDeletedData {
  comment_id: number
  app_id: number
  user_id: number | null
  type: string
}

/** @deprecated Use CommentCreatedData / CommentUpdatedData / CommentDeletedData */
export interface CommentEventData {
  comment_id: number
  app_id: number
  user_id?: number
  content?: string
  upvotes?: number
  downvotes?: number
}

export interface UiUpdateData {
  version: string
}

export interface AppBoostUpdatedData {
  user_id: number
  instance_id: number
  cylo_id: number
  boost_slots: number
  resource_multiplier: number
}

export interface DomainChangedData {
  user_id: number
  instance_id: number
  action: "created" | "deleted" | "updated" | string
  domain_id?: number | null
}

// ── Event Data Types (cylo-serverapi) ──

export interface JobProgressData {
  job_id: number
  cylo_id: number
  instance_id: number
  /** Current description/step text from the job record */
  status: string
}

export interface JobCompletedData {
  job_id: number
  cylo_id: number
  instance_id: number
  result: string
}

export interface JobFailedData {
  job_id: number
  cylo_id: number
  instance_id: number
  error: string
}

export interface InstanceStateData {
  instance_id: number
  cylo_id: number
  /** Mirrors InstalledApp.status — emitted by the queue worker after job.completed/job.failed */
  status:
    | "online"
    | "offline"
    | "inactive"
    | "installing"
    | "updating"
    | "deleting"
}

/** Full stats payload pushed by the stats.update event from ws-gateway */
export interface StatsUpdateData {
  cylo_id: number
  range: string
  disk_history: { timestamp: string; used: number; total: number }[]
  diskio_history: { timestamp: string; user_util: number; io_util: number }[]
  network_history: { timestamp: string; upload: number; download: number }[]
  /** 30-day cumulative totals in bytes (always 30d regardless of chart range) */
  upload_total_bytes: number
  download_total_bytes: number
}

export interface QuotaUpdateData {
  cylo_id: number
  used_gb: number
  soft_gb: number
  hard_gb: number
}

/** Container stats payload pushed by container_stats.update from ws-gateway */
export interface ContainerStatsUpdateData {
  instance_id: number
  range: string
  cpu_history: { timestamp: string; value: number }[]
  mem_history: { timestamp: string; value: number }[]
  diskio_history: { timestamp: string; read: number; write: number }[]
  network_history: { timestamp: string; download: number; upload: number }[]
}
