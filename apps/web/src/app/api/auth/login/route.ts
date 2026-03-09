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
  // response.headers.getSetCookie() returns all Set-Cookie headers
  const setCookies = response.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    const match = cookie.match(/authorization_token=([^;]+)/)
    if (match && match[1] && match[1] !== "0") {
      return match[1]
    }
  }
  // Fallback: check the combined header
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

    // Backend expects: email, password, firstname, lastname
    const response = await fetch(
      `${API_BASE_URL}/users/authenticate/username`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Appbox-Web/2.0"
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          firstname: "",
          lastname: ""
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const errorMsg =
        typeof data?.error === "object" && data.error?.message
          ? data.error.message
          : typeof data?.message === "string"
            ? data.message
            : "Invalid credentials."
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    // Check if 2FA is required
    if (data.requires_2fa) {
      return NextResponse.json({
        two_factor_required: true,
        two_factor_token: data.two_factor_token || ""
      })
    }

    // Extract the auth token from the backend's Set-Cookie header
    const token = extractTokenFromSetCookie(response)

    const res = NextResponse.json({ success: true })
    if (token) {
      res.cookies.set("authorization_token", token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "strict",
        path: "/",
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
        maxAge: 60 * 60 * 24 * 30 // 30 days
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
