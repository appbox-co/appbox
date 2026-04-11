import { apiGet, apiPost } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CyloSummary {
  id: number
  name: string
  server_name: string
  status: string
  storage_used: number // GB
  storage_total: number // GB
  app_slots_used: number
  app_slots_total: number
  upload_used: number
  download_used: number
  resource_multiplier: number
  is_migrating: boolean
  is_throttled: boolean
  is_low_quota: boolean
  package_name: string
}

export interface MigrationProgress {
  phase: number // 1-8
  complete: number // 0-100
  live_migration: number // 0 or 1
  total_sent: number // bytes
  pre_migration_space_used: string // bytes as string
  reason: string
  ETA: string // ISO 8601
  avg_speed: string // e.g. "45.20 MB/s"
  old_server_name: string
  new_server_name: string
  transferred_percent: number
}

export interface ThrottleDetails {
  throttle_level: number
  throttle_rate_mbps: number // throttle_rate (KB/s) / 1024
  throttle_iops: number
  expires_at: string // ISO 8601
  app_instance_domain: string
  top_process_name: string
  disk_util_percent: number
  duration_minutes: number
}

export interface LowQuotaDetails {
  available_kib: number // KiB
}

export interface CyloDetail {
  id: number
  name: string
  server_name: string
  server_host: string
  status: string
  package_name: string
  storage_used: number // GB
  storage_total: number // GB
  app_slots_used: number
  app_slots_total: number
  upload_used: number
  download_used: number
  upload_total: number
  download_total: number
  resource_multiplier: number
  is_migrating: boolean
  is_throttled: boolean
  is_low_quota: boolean
  migration_progress?: MigrationProgress
  throttle_details?: ThrottleDetails
  low_quota_details?: LowQuotaDetails
  whmcs_serviceid?: number
  created_at: string
}

export interface CyloStats {
  disk_history: { timestamp: string; used: number; total: number }[]
  diskio_history: { timestamp: string; user_util: number; io_util: number }[]
  network_history: { timestamp: string; upload: number; download: number }[]
}

export interface CyloDiskQuota {
  used_gb: number
}

export interface CyloBandwidth {
  upload_bytes: number
  download_bytes: number
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Backend returns `{ items, totalCount }` from `GET /v1/cylos/`.
 * We map backend field names to our frontend CyloSummary type.
 */
export async function getCylosSummary(userId?: number): Promise<CyloSummary[]> {
  const query = userId ? `cylos?user_id=${userId}` : "cylos"

  const res = await apiGet<{ items: unknown[]; totalCount: number }>(query)
  const items = res.items ?? []
  return items.map((c: unknown) => {
    const row = c as Record<string, unknown>
    // Derive a human-readable status string from backend fields
    let status = "online"
    if (row.migrating) status = "migrating"
    else if (row.installing) status = "installing"
    else if (!row.enabled) status = "suspended"
    else if (Number(row.restarting ?? 0) === 1) status = "restarting"

    return {
      id: Number(row.id),
      name: String(row.cyloname ?? ""),
      server_name: String(row.server_name ?? ""),
      status,
      storage_used: 0, // Not provided in list endpoint
      storage_total: Number(row.storage_limit ?? 0), // DB stores GB
      app_slots_used: Number(row.app_slots ?? 0) - Number(row.free_slots ?? 0),
      app_slots_total: Number(row.app_slots ?? 0),
      upload_used: 0,
      download_used: 0,
      resource_multiplier: Number(
        row.resource_multiplier_current ?? row.resource_multiplier ?? 1
      ),
      is_migrating: !!row.migrating,
      is_throttled: !!row.is_throttled,
      is_low_quota: !!row.low_quota,
      package_name: String(row.package_name ?? "")
    }
  })
}

/**
 * Backend returns raw DB column names that differ from our frontend types.
 * Key mappings: cyloname→name, restarting→status, storage_limit→storage_total, etc.
 */
export async function getCylo(id: number): Promise<CyloDetail> {
  const raw = await apiGet<Record<string, unknown>>(`cylos/${id}`)

  // Derive a human-readable status string from backend fields
  let status = "online"
  if (raw.migrating) status = "migrating"
  else if (raw.installing) status = "installing"
  else if (!raw.enabled) status = "suspended"
  else if (Number(raw.restarting ?? 0) === 1) status = "restarting"

  let migrationProgress: MigrationProgress | undefined
  if (raw.migrating) {
    try {
      const migrationRaw = await apiGet<Record<string, unknown>>(
        `migrations/cylo/${id}`
      )
      if (migrationRaw && typeof migrationRaw === "object") {
        migrationProgress = {
          phase: Number(migrationRaw.phase ?? 0),
          complete: Number(migrationRaw.complete ?? 0),
          live_migration: Number(migrationRaw.live_migration ?? 0),
          total_sent: Number(migrationRaw.total_sent ?? 0),
          pre_migration_space_used: String(
            migrationRaw.pre_migration_space_used ?? "0"
          ),
          reason: String(migrationRaw.reason ?? ""),
          ETA: String(migrationRaw.ETA ?? ""),
          avg_speed: String(migrationRaw.avg_speed ?? ""),
          old_server_name: String(migrationRaw.old_server_name ?? ""),
          new_server_name: String(migrationRaw.new_server_name ?? ""),
          transferred_percent: Number(
            migrationRaw.transferred_percent ?? migrationRaw.complete ?? 0
          )
        }
      }
    } catch {
      // Some backends return 404/false before migration details are materialized.
      migrationProgress = undefined
    }
  }

  return {
    id: Number(raw.id),
    name: String(raw.cyloname ?? ""),
    server_name: String(raw.server_name ?? ""),
    server_host: String(raw.server_ip ?? ""),
    status,
    package_name: String(raw.package_name ?? ""),
    storage_used: 0, // Not directly available from this endpoint
    storage_total: Number(raw.storage_limit ?? 0), // DB stores GB
    app_slots_used: Number(raw.app_slots ?? 0) - Number(raw.free_slots ?? 0),
    app_slots_total: Number(raw.app_slots ?? 0),
    upload_used: 0,
    download_used: 0,
    upload_total: 0,
    download_total: 0,
    resource_multiplier: Number(
      raw.resource_multiplier_current ?? raw.resource_multiplier ?? 1
    ),
    is_migrating: !!raw.migrating,
    is_throttled: !!raw.is_throttled,
    is_low_quota: !!raw.low_quota,
    migration_progress: migrationProgress,
    throttle_details: undefined, // populated by throttledcylos API or dev panel
    low_quota_details: undefined, // populated by lowquota API or dev panel
    whmcs_serviceid: raw.whmcs_serviceid as number | undefined,
    created_at: String(raw.created_at ?? "")
  }
}

export async function restartCylo(id: number): Promise<void> {
  await apiPost(`cylos/restart/${id}`, {})
}
