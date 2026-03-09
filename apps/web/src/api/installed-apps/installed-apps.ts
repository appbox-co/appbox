import type { CustomField } from "@/api/apps/app-store"
import { apiDelete, apiGet, apiPost, apiPut, serverApiGet } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface InstalledApp {
  id: number
  app_id: number
  display_name: string
  icon_image: string
  version: string
  status: string
  port: number
  cylo_id: number
  cylo_name: string
  server_name: string
  domain: string
  app_slots: number
  install_date: string
  /** "docker" for container apps, "vm" for virtual machine apps */
  app_type: string
  state: number
  enabled: boolean
  cylo_default: number
  multiple_domains: number
  boost_slots: number
  use_boost_system: number
  boost_increment: number
  max_boost_multiplier: number
  max_boost_slots: number
  ram: number
  cpus: number
  can_update: boolean
  custom_fields?: Record<string, CustomField>
  available_versions: { id: number; version: string }[]
}

export interface InstalledAppVncInfo {
  vnc_port: number | null
  websocket_port: number | null
  password: string
  instance_id: number
  vm_name: string | null
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Map a raw backend app-instance record to our InstalledApp type.
 * Backend field names differ: state (int) → status (string),
 * cyloname → cylo_name, version (int) → looked up from app object, etc.
 */

function mapInstalledApp(raw: Record<string, unknown>): InstalledApp {
  // Derive a human-readable status string
  let status = "offline"
  if (raw.deleting) status = "deleting"
  else if (raw.updating) status = "updating"
  else if (raw.installing) status = "installing"
  else if (!raw.enabled) status = "inactive"
  else if (raw.state === 1) status = "online"

  const app = raw.app as Record<string, unknown> | undefined
  const availableVersionsRaw =
    raw.available_versions ??
    app?.available_versions ??
    app?.versions ??
    []
  const availableVersions = Array.isArray(availableVersionsRaw)
    ? availableVersionsRaw
        .map((v: Record<string, unknown>) => ({
          id: Number(v?.id ?? 0),
          version: String(v?.version ?? "")
        }))
        .filter((v) => v.id > 0 && v.version.length > 0)
    : []

  return {
    id: Number(raw.id),
    app_id: Number(raw.app_id ?? 0),
    display_name: String(raw.display_name ?? ""),
    icon_image: String(raw.icon_image ?? ""),
    version: String(raw.version ?? app?.version ?? raw.latest_ver ?? ""),
    status,
    port: Number(raw.port ?? 0),
    cylo_id: Number(raw.cylo_id ?? 0),
    cylo_name: String(raw.cyloname ?? ""),
    server_name: String(raw.server_name ?? ""),
    domain: String(raw.domain ?? ""),
    app_slots: Number(raw.app_slots ?? 1),
    install_date: raw.created_at ? String(raw.created_at) : "",
    app_type: String(app?.type ?? "docker"),
    state: Number(raw.state ?? 0),
    enabled: Boolean(raw.enabled),
    cylo_default: Number(raw.cylo_default ?? 0),
    multiple_domains: Number(
      app?.multiple_domains ?? raw.multiple_domains ?? 0
    ),
    boost_slots: Number(raw.boost_slots ?? 0),
    use_boost_system: Number(raw.use_boost_system ?? 0),
    boost_increment: Number(raw.boost_increment ?? 0.1),
    max_boost_multiplier: Number(raw.max_boost_multiplier ?? 8),
    max_boost_slots: Number(raw.max_boost_slots ?? 0),
    ram: Number(raw.ram ?? raw.Memory ?? 0),
    cpus: Number(raw.cpus ?? raw.CPUs ?? 0),
    can_update: Number(app?.canUpdate ?? raw.canUpdate ?? 1) === 1,
    custom_fields: (app?.customFields ?? raw.customFields) as
      | Record<string, CustomField>
      | undefined,
    available_versions: availableVersions
  }
}

export async function getInstalledApps(
  cyloId?: number,
  userId?: number
): Promise<InstalledApp[]> {
  const parts: string[] = ["limit=999"]
  if (cyloId) parts.push(`cylo_id=${cyloId}`)
  if (userId) parts.push(`user_id=${userId}`)
  const query = `apps/instances?${parts.join("&")}`

  const res = await apiGet<{ items: unknown[] } | unknown[]>(query)
  const items = Array.isArray(res) ? res : (res.items ?? [])
  return items.map((raw) => mapInstalledApp(raw as Record<string, unknown>))
}

export async function getInstalledApp(id: number): Promise<InstalledApp> {
  const raw = await apiGet<Record<string, unknown>>(`apps/instances/${id}`)
  return mapInstalledApp(raw)
}

export async function getInstalledAppVncInfo(
  serverName: string,
  id: number
): Promise<InstalledAppVncInfo> {
  const response = await serverApiGet<
    InstalledAppVncInfo & { error?: string; message?: string }
  >(serverName, `app/instances/${id}/vnc`)

  if (response.error) {
    throw new Error(
      response.message
        ? `${response.error}: ${response.message}`
        : response.error
    )
  }

  return response
}

/**
 * Backend: PUT /v1/apps/instances/start/{id}
 * (PUT, not POST; action before id)
 */
export async function startApp(id: number): Promise<void> {
  return apiPut(`apps/instances/start/${id}`)
}

/**
 * Backend: PUT /v1/apps/instances/stop/{id}
 */
export async function stopApp(id: number): Promise<void> {
  return apiPut(`apps/instances/stop/${id}`)
}

/**
 * Backend: PUT /v1/apps/instances/restart/{id}
 */
export async function restartApp(id: number): Promise<void> {
  return apiPut(`apps/instances/restart/${id}`)
}

/**
 * Backend: PUT /v1/apps/instances/update/{id}
 */
export async function updateApp(
  id: number,
  versionId: number
): Promise<{ job_id: number }> {
  return apiPut<{ job_id: number }>(`apps/instances/update/${id}`, {
    version_id: versionId
  })
}

export async function uninstallApp(id: number): Promise<{ job_id: number }> {
  return apiDelete<{ job_id: number }>(`apps/instances/${id}`)
}

/**
 * Backend: POST /v1/apps/instances/switchversion/{id}
 * (no hyphen in "switchversion", id after verb)
 */
export async function switchVersion(
  id: number,
  versionId: number
): Promise<{ job_id: number }> {
  return apiPost<{ job_id: number }>(`apps/instances/switchversion/${id}`, {
    version_id: versionId
  })
}

export async function boostInstance(
  id: number,
  boostSlots: number
): Promise<void> {
  return apiPost<void>(`apps/instances/${id}/boost`, {
    boost_slots: boostSlots
  })
}

/**
 * Backend: PUT /v1/apps/instances (uses PUT to create, not POST)
 * Custom field values are sent as top-level keys alongside app_id, cylo_id, etc.
 */
export async function installApp(data: {
  app_id: number
  version_id: number
  cylo_id: number
  [key: string]: unknown
}): Promise<{ id: number }> {
  return apiPut<{ id: number }>("apps/instances", data)
}
