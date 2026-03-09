import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const IS_PRODUCTION = process.env.NODE_ENV === "production"
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (IS_PRODUCTION ? ".appbox.co" : undefined)
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : IS_PRODUCTION

/**
 * Extract the authorization_token value from the backend's Set-Cookie header(s).
 */
function extractTokenFromSetCookie(response: Response): string | null {
  const setCookies = response.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    const match = cookie.match(/authorization_token=([^;]+)/)
    if (match && match[1] && match[1] !== "0") {
      return match[1]
    }
  }
  const raw = response.headers.get("set-cookie") ?? ""
  const match = raw.match(/authorization_token=([^;]+)/)
  if (match && match[1] && match[1] !== "0") {
    return match[1]
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Route recovery code logins to the dedicated recovery endpoint
    const isRecovery = !!body.use_recovery
    const endpoint = isRecovery
      ? `${API_BASE_URL}/users/2fa/authenticate/recovery`
      : `${API_BASE_URL}/users/2fa/authenticate`

    // Strip the use_recovery flag before forwarding to the backend
    const { use_recovery: _omit, ...forwardBody } = body

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Appbox-Web/2.0"
      },
      body: JSON.stringify(forwardBody)
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMsg =
        typeof data?.error === "object" && data.error?.message
          ? data.error.message
          : typeof data?.message === "string"
            ? data.message
            : "Invalid verification code."
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    // Extract the auth token from the backend's Set-Cookie header
    const token = extractTokenFromSetCookie(response)

    const res = NextResponse.json({
      success: true,
      recovery_codes_low: data.recovery_codes_low ?? false,
      recovery_codes_exhausted: data.recovery_codes_exhausted ?? false,
      remaining_recovery_codes: data.remaining_recovery_codes ?? null
    })
    if (token) {
      res.cookies.set("authorization_token", token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "lax",
        path: "/",
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
        maxAge: 60 * 60 * 24 * 30
      })
    }

    return res
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
