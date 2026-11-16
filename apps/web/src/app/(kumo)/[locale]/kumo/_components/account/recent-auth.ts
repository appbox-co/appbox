import { ApiError } from "@/api/client"

/**
 * Sensitive account changes need a sign-in from the last few minutes. The API
 * refuses them with one of these messages otherwise; the page then asks for
 * the password again (see `RecentAuthDialog`) and retries.
 *
 * Same test as the current design's recent-auth-dialog.tsx.
 */
export function isRecentAuthError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("recent authentication is required") ||
    message.includes("recent user authentication is required") ||
    message.includes("auth: recent authentication required")
  )
}

/** What is sent to sign in again: the password first, then a code if asked. */
export type ReauthRequest =
  | { password: string }
  | { code: string; two_factor_token: string; use_recovery: boolean }

/** The answer, in the shape `/api/auth/reauth` gives it. */
export interface ReauthResult {
  ok: boolean
  error?: string
  two_factor_required?: boolean
  two_factor_token?: string
}

/**
 * Signs in again. Pages on live data pass `postReauth`; sample pages pass a
 * stand-in, so nothing typed into them is sent anywhere.
 */
export type Reauth = (request: ReauthRequest) => Promise<ReauthResult>
