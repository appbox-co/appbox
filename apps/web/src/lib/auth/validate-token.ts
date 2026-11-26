const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"

/** The account fields the web app reads from `users/validate_token`. */
export interface TokenUser {
  id: number
  email: string
  firstname: string
  lastname: string
  alias: string | null
  avatar: string | null
  roles: string
  totp_enabled: boolean | number
  brand_id: number
  currency_code: string
  created_at: string
}

/**
 * The account a session token belongs to, or null when the API doesn't accept
 * the token. Any other failure, such as a rate limit (429) or a server error,
 * throws, so a caller can tell "not signed in" from "couldn't ask". Usable
 * anywhere on the server, the request proxy included. A caller that must not
 * wait on a slow API passes a `signal` with a timeout.
 */
export async function fetchTokenUser(
  token: string,
  signal?: AbortSignal
): Promise<TokenUser | null> {
  const response = await fetch(`${API_BASE_URL}/users/validate_token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      Cookie: `authorization_token=${token}`
    },
    cache: "no-store",
    signal
  })
  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) {
    throw new Error(`validate_token answered ${response.status}`)
  }

  const user = await response.json()
  // The API answers `false` for a token it doesn't accept.
  return user && user.id ? user : null
}
