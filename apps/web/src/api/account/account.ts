import { apiGet, apiPost } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  id: number
  email: string
  alias: string
  avatar_url: string | null
  two_factor_enabled: boolean
  created_at: string
}

/** Backend status codes (AbuseTypes::STATUSES). Status 1 = waiting for user response (user can resolve). */
export const ABUSE_STATUS_LABELS: Record<number, string> = {
  [-1]: "New",
  0: "Closed by user (files deleted)",
  1: "Waiting for response from user (files quarantined)",
  2: "Closed automatically (files deleted)",
  3: "Closed automatically (files not found)",
  4: "Closed automatically (cylo no longer exists)",
  5: "Unresolvable automatically (no XML in email, manual investigation)",
  6: "Unresolvable automatically (XML found but failed to parse, manual investigation)",
  7: "Searching for data",
  8: "Closed by team member (after manual investigation)",
  9: "Unresolvable automatically (Cannot find IP or port or file name in xml, manual investigation)",
  10: "Unresolvable automatically (The IP in the report does not belong to us, manual investigation)",
  11: "Unresolvable automatically (The timestamp in the report is invalid, manual investigation)",
  12: "Closed by complainant"
}

export function abuseStatusToLabel(statusCode: number): string {
  return ABUSE_STATUS_LABELS[statusCode] ?? String(statusCode)
}

/** List item: normalized from backend (notifier→complainant, body→description, status int→label). */
export interface AbuseReport {
  id: number
  isp_id?: string | number
  subject: string
  status: string
  statusCode: number
  description: string
  complainant: string
  admin_response?: string | null
  created_at: string
  updated_at: string
  cyloname?: string
}

/** Detail: full report with timeline and optional extra fields from getOne. */
export interface AbuseReportDetail extends AbuseReport {
  ip?: string
  port?: number
  timestamp?: string
  filename?: string
  hash?: string
  cyloname?: string
  server_name?: string
  timeline?: AbuseTimelineEntry[]
}

export interface AbuseTimelineEntry {
  id?: number
  abuse_id: number
  status: number
  created_at: string
}

/** One file in quarantine (from getFiles). */
export interface AbuseReportFile {
  id?: number
  disk_location: string
}

export interface TwoFactorSecret {
  secret: string
  provisioning_uri: string
}

export interface TwoFactorVerifyResult {
  recovery_codes: string[]
}

export interface TwoFactorStatus {
  enabled: boolean
  required: boolean
  verified_at: string | null
  recovery_codes_remaining: number
  recovery_codes_low: boolean
  recovery_codes_exhausted: boolean
}

export interface RegenerateRecoveryCodesResult {
  recovery_codes: string[]
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Backend: GET /v1/users/{id} (PRIV)
 * No /users/me endpoint exists.
 */
export async function getProfile(userId: number): Promise<UserProfile> {
  const raw = await apiGet<Record<string, unknown>>(`users/${userId}`)
  return {
    ...raw,
    two_factor_enabled: !!(
      (raw.two_factor_enabled as boolean | undefined) ??
      (raw.totp_enabled as boolean | undefined)
    )
  } as UserProfile
}

/**
 * Backend: POST /v1/users/{id} (PRIV)
 * Backend uses POST for updates, not PUT.
 */
export async function updateProfile(
  userId: number,
  data: { alias?: string }
): Promise<UserProfile> {
  return apiPost<UserProfile>(`users/${userId}`, data)
}

/**
 * Backend: POST /v1/users/{id} with oldPassword/newPassword fields.
 * No separate /users/me/password endpoint exists.
 */
export async function changePassword(
  userId: number,
  data: { current_password: string; new_password: string }
): Promise<void> {
  return apiPost(`users/${userId}`, {
    oldPassword: data.current_password,
    newPassword: data.new_password
  })
}

/** Raw list item from backend (getAll). */
interface RawAbuseListItem {
  id: number
  isp_id?: string | number
  subject?: string
  body?: string
  notifier?: string
  status?: number
  created_at?: string
  updated_at?: string
  cyloname?: string
  [key: string]: unknown
}

/** Raw detail from backend (getOne). */
interface RawAbuseDetail extends RawAbuseListItem {
  ip?: string
  port?: number
  timestamp?: string
  filename?: string
  hash?: string
  server_name?: string
  timeline?: AbuseTimelineEntry[]
  [key: string]: unknown
}

function rawToListItem(row: RawAbuseListItem): AbuseReport {
  const statusCode = typeof row.status === "number" ? row.status : -1
  return {
    id: row.id,
    isp_id: row.isp_id,
    subject: row.subject ?? "",
    status: abuseStatusToLabel(statusCode),
    statusCode,
    description: row.body ?? "",
    complainant: row.notifier ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    cyloname: row.cyloname
  }
}

function rawToDetail(row: RawAbuseDetail): AbuseReportDetail {
  const base = rawToListItem(row)
  return {
    ...base,
    ip: row.ip,
    port: row.port,
    timestamp: row.timestamp,
    filename: row.filename,
    hash: row.hash,
    server_name: row.server_name,
    timeline: row.timeline ?? []
  }
}

/**
 * Backend: GET /v1/abuse (paginated). Returns list for current user (or all for admin).
 */
export async function getAbuseReports(userId?: number): Promise<AbuseReport[]> {
  const query = userId ? `abuse?user_id=${userId}` : "abuse"
  const res = await apiGet<{ items: RawAbuseListItem[] }>(query)
  const items = res.items ?? []
  return items.map(rawToListItem)
}

/**
 * Backend: GET /v1/abuse/{id} (accepts id or isp_id). Returns full report with timeline.
 */
export async function getAbuseReport(
  id: number
): Promise<AbuseReportDetail> {
  const raw = await apiGet<RawAbuseDetail>(`abuse/${id}`)
  return rawToDetail(raw)
}

/**
 * Backend: GET /v1/abuse/{id}?token=xxx — complainant access without login.
 * id can be numeric id or isp_id (email links use isp_id in the path).
 */
export async function getAbuseReportWithToken(
  id: number | string,
  token: string
): Promise<AbuseReportDetail> {
  const raw = await apiGet<RawAbuseDetail>(`abuse/${encodeURIComponent(String(id))}`, {
    params: { token }
  })
  return rawToDetail(raw)
}

/**
 * Backend: GET /v1/abuse/getFiles/{abuseId} — files in quarantine for this report.
 */
export async function getAbuseReportFiles(
  abuseId: number
): Promise<{ items: AbuseReportFile[] }> {
  const res = await apiGet<{ items: AbuseReportFile[] }>(
    `abuse/getFiles/${abuseId}`
  )
  return { items: res.items ?? [] }
}

/**
 * Backend: POST /v1/abuse/resolve/{abuseId}. Resolve the case (user flow when status is 1).
 */
export async function resolveAbuseReport(abuseId: number): Promise<void> {
  await apiPost(`abuse/resolve/${abuseId}`, {})
}

/**
 * Backend: POST /v1/abuse/resolve/{abuseId}?token=xxx — complainant closes case (status → 12).
 * abuseId can be numeric id or isp_id.
 */
export async function resolveAbuseReportWithToken(
  abuseId: number | string,
  token: string
): Promise<void> {
  await apiPost(`abuse/resolve/${encodeURIComponent(String(abuseId))}`, {}, { params: { token } })
}

/**
 * Backend: GET /v1/users/2fa/status (PRIV)
 */
export async function get2FAStatus(): Promise<TwoFactorStatus> {
  return apiGet<TwoFactorStatus>("users/2fa/status")
}

/**
 * Backend: POST /v1/users/2fa/setup (PRIV)
 * Returns secret and provisioning_uri (otpauth:// URI for QR code generation).
 */
export async function generate2FASecret(): Promise<TwoFactorSecret> {
  return apiPost<TwoFactorSecret>("users/2fa/setup")
}

/**
 * Backend: POST /v1/users/2fa/verify (PRIV)
 * Returns recovery_codes on success.
 */
export async function verify2FA(data: {
  code: string
}): Promise<TwoFactorVerifyResult> {
  return apiPost<TwoFactorVerifyResult>("users/2fa/verify", data)
}

/**
 * Backend: POST /v1/users/2fa/disable (PRIV)
 * Requires a 6-digit TOTP code or 8-character recovery code — NOT the account password.
 */
export async function disable2FA(data: { code: string }): Promise<void> {
  return apiPost("users/2fa/disable", data)
}

/**
 * Backend: POST /v1/users/2fa/recovery-codes (PRIV)
 * Regenerates recovery codes. Requires current TOTP code to confirm.
 */
export async function regenerateRecoveryCodes(data: {
  code: string
}): Promise<RegenerateRecoveryCodesResult> {
  return apiPost<RegenerateRecoveryCodesResult>(
    "users/2fa/recovery-codes",
    data
  )
}
