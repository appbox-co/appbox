export const API_BASE_URL =
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
 * the token. Usable anywhere on the server, the request proxy included.
 */
export async function fetchTokenUser(token: string): Promise<TokenUser | null> {
  const response = await fetch(`${API_BASE_URL}/users/validate_token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      Cookie: `authorization_token=${token}`
    },
    cache: "no-store"
  })
  if (!response.ok) return null

  const user = await response.json()
  // The API answers `false` for a token it doesn't accept.
  return user && user.id ? user : null
}
