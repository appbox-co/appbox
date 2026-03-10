// WebSocket event types for cylo-api
export const WS_EVENTS = {
  // Notification events
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_UNREAD_COUNT: "notification.unread_count",

  // Migration events
  MIGRATION_PROGRESS: "migration.progress",
  MIGRATION_COMPLETED: "migration.completed",

  // Cylo events
  CYLO_QUOTA_LOW: "cylo.quota.low",
  CYLO_QUOTA_NORMAL: "cylo.quota.normal",
  CYLO_THROTTLE_CHANGED: "cylo.throttle.changed",

  // Comment events
  COMMENT_CREATED: "comment.created",
  COMMENT_UPDATED: "comment.updated",
  COMMENT_DELETED: "comment.deleted",
  COMMENT_VOTED: "comment.voted",

  // Auth events
  USER_SESSION_EXPIRED: "user.session_expired",

  // UI events
  UI_UPDATE: "ui.update",
  APP_BOOST_UPDATED: "app.boost.updated",
  CUSTOM_TABLE_CHANGED: "custom_table.changed",
  DOMAIN_CHANGED: "domain.changed"
} as const

// WebSocket event types for cylo-serverapi
export const WS_SERVER_EVENTS = {
  JOB_STARTED: "job.started",
  JOB_PROGRESS: "job.progress",
  JOB_COMPLETED: "job.completed",
  JOB_FAILED: "job.failed",
  INSTANCE_STATE: "instance.state",
  STATS_UPDATE: "stats.update",
  CONTAINER_STATS_UPDATE: "container_stats.update",
  QUOTA_UPDATE: "quota.update"
} as const

// WebSocket channel prefixes
export const WS_CHANNELS = {
  USER: "user",
  CYLO: "cylo",
  INSTANCE: "instance",
  APP: "app",
  GLOBAL: "global"
} as const

export type WsEventType =
  | (typeof WS_EVENTS)[keyof typeof WS_EVENTS]
  | (typeof WS_SERVER_EVENTS)[keyof typeof WS_SERVER_EVENTS]
