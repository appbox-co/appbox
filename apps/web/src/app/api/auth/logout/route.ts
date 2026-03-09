import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const IS_PRODUCTION = process.env.NODE_ENV === "production"
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (IS_PRODUCTION ? ".appbox.co" : undefined)
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : IS_PRODUCTION

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("authorization_token")?.value
    if (token) {
      await fetch(`${API_BASE_URL}/users/signout`, {
        method: "DELETE",
        headers: {
          Cookie: `authorization_token=${token}`,
          Accept: "application/json",
          "User-Agent": "Appbox-Web/2.0"
        }
      }).catch(() => {})
    }
  } catch {
    // Ignore
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set("authorization_token", "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    maxAge: 0
  })
  return res
}
