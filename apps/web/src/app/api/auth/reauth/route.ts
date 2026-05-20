import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const IS_PRODUCTION = process.env.NODE_ENV === "production"
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (IS_PRODUCTION ? ".appbox.co" : undefined)
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : IS_PRODUCTION

interface AuthResponseBody {
  error?: {
    message?: string
  }
  id?: number
  email?: string
  message?: string
  requires_2fa?: boolean
  two_factor_required?: boolean
  two_factor_token?: string
}

interface ReauthRequestBody {
  password?: string
  code?: string
  two_factor_token?: string
  use_recovery?: boolean
}

function getEffectiveCookieDomain(request: NextRequest): string | undefined {
  if (COOKIE_DOMAIN) return COOKIE_DOMAIN
  const host = request.headers.get("host") ?? ""
  const hostname = host.split(":")[0]?.toLowerCase() ?? ""
  if (hostname === "appbox.co" || hostname.endsWith(".appbox.co")) {
    return ".appbox.co"
  }
  return undefined
}

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

async function parseJsonSafe(response: Response): Promise<AuthResponseBody> {
  try {
    return (await response.json()) as AuthResponseBody
  } catch {
    return {}
  }
}

async function getCurrentUser(token: string): Promise<AuthResponseBody | null> {
  const response = await fetch(`${API_BASE_URL}/users/validate_token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      Cookie: `authorization_token=${token}`
    },
    cache: "no-store"
  })

  if (!response.ok) {
    return null
  }

  const data = await parseJsonSafe(response)
  if (!data?.id || !data.email) {
    return null
  }

  return data
}

function getErrorMessage(data: AuthResponseBody, fallback: string): string {
  if (typeof data.error === "object" && data.error?.message) {
    return data.error.message
  }
  if (typeof data.message === "string") {
    return data.message
  }
  return fallback
}

function setAuthCookie(
  response: NextResponse,
  request: NextRequest,
  token: string
) {
  response.cookies.set("authorization_token", token, {
    httpOnly: true,
    secure: COOKIE_SECURE || request.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/",
    ...(getEffectiveCookieDomain(request)
      ? { domain: getEffectiveCookieDomain(request) }
      : {}),
    maxAge: 60 * 60 * 24 * 30
  })
}

async function completeTwoFactorReauth(
  request: NextRequest,
  currentUserId: number,
  body: ReauthRequestBody
) {
  const endpoint = body.use_recovery
    ? `${API_BASE_URL}/users/2fa/authenticate/recovery`
    : `${API_BASE_URL}/users/2fa/authenticate`

  const authResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0"
    },
    body: JSON.stringify({
      code: body.code,
      two_factor_token: body.two_factor_token
    })
  })

  const data = await parseJsonSafe(authResponse)
  if (!authResponse.ok) {
    return NextResponse.json(
      { error: getErrorMessage(data, "Invalid verification code.") },
      { status: authResponse.status }
    )
  }

  if (data.id !== currentUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const token = extractTokenFromSetCookie(authResponse)
  if (!token) {
    return NextResponse.json(
      { error: "Authentication token was not returned." },
      { status: 502 }
    )
  }

  const response = NextResponse.json({ success: true })
  setAuthCookie(response, request, token)
  return response
}

export async function POST(request: NextRequest) {
  try {
    const currentToken = request.cookies.get("authorization_token")?.value
    if (!currentToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(currentToken)
    if (!currentUser?.id || !currentUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as ReauthRequestBody

    if (body.two_factor_token) {
      return completeTwoFactorReauth(request, currentUser.id, body)
    }

    const authResponse = await fetch(
      `${API_BASE_URL}/users/authenticate/username`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Appbox-Web/2.0"
        },
        body: JSON.stringify({
          email: currentUser.email,
          password: body.password,
          firstname: "",
          lastname: ""
        })
      }
    )

    const data = await parseJsonSafe(authResponse)

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: getErrorMessage(data, "Invalid credentials.") },
        { status: authResponse.status }
      )
    }

    if (data.requires_2fa || data.two_factor_required) {
      return NextResponse.json({
        two_factor_required: true,
        two_factor_token: data.two_factor_token ?? ""
      })
    }

    if (data.id !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const token = extractTokenFromSetCookie(authResponse)
    if (!token) {
      return NextResponse.json(
        { error: "Authentication token was not returned." },
        { status: 502 }
      )
    }

    const response = NextResponse.json({ success: true })
    setAuthCookie(response, request, token)
    return response
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
