import { ApiError } from "@/api/client"

/**
 * Sensitive account changes need a sign-in from the last few minutes. The API
 * refuses them with one of these messages otherwise; the page then asks for
 * the password again and retries.
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

/** Signs in again through the app's own route, with the browser's cookies. */
export async function postReauth(
  request: ReauthRequest
): Promise<ReauthResult> {
  const response = await fetch("/api/auth/reauth", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(request)
  })

  const data = (await response.json().catch(() => ({}))) as Omit<
    ReauthResult,
    "ok"
  >
  return { ...data, ok: response.ok }
}
