import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const IS_PRODUCTION = process.env.NODE_ENV === "production"
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (IS_PRODUCTION ? ".appbox.co" : undefined)
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : IS_PRODUCTION

function normalizedCookieDomainsFromConfig(): (string | undefined)[] {
  const values = new Set<string | undefined>([undefined])
  if (COOKIE_DOMAIN) {
    values.add(COOKIE_DOMAIN)
    values.add(COOKIE_DOMAIN.replace(/^\./, ""))
  }
  return [...values]
}

function normalizedCookieDomainsForHost(host: string): (string | undefined)[] {
  const values = new Set<string | undefined>(normalizedCookieDomainsFromConfig())
  const hostname = host.split(":")[0]?.toLowerCase() ?? ""

  // Skip localhost-style hosts; host-only clear is enough there.
  if (!hostname || !hostname.includes(".") || hostname === "localhost") {
    return [...values]
  }

  const labels = hostname.split(".").filter(Boolean)
  if (labels.length >= 2) {
    const apex = labels.slice(-2).join(".")
    values.add(apex)
    values.add(`.${apex}`)
  }

  return [...values]
}

export async function POST(request: NextRequest) {
  const debugEnabled = request.nextUrl.searchParams.get("debug") === "1"
  const incomingToken = request.cookies.get("authorization_token")?.value
  const host = request.headers.get("host") ?? ""
  const domainsToClear = normalizedCookieDomainsForHost(host)
  const secureForRequest = COOKIE_SECURE || request.nextUrl.protocol === "https:"
  const debugInfo: Record<string, unknown> = {
    host,
    origin: request.headers.get("origin") ?? "",
    cookieDomainConfig: COOKIE_DOMAIN ?? null,
    cookieSecureConfig: COOKIE_SECURE,
    cookieSecureEffective: secureForRequest,
    hasIncomingAuthCookie: Boolean(incomingToken),
    incomingTokenPrefix: incomingToken ? incomingToken.slice(0, 16) : null,
    incomingCookies: request.cookies.getAll().map((c) => c.name),
    domainsToClear: domainsToClear.map((d) => d ?? "(host-only)"),
    clearedVariants: [] as Array<{ domain: string; sameSite: string }>
  }

  try {
    if (incomingToken) {
      await fetch(`${API_BASE_URL}/users/signout`, {
        method: "DELETE",
        headers: {
          Cookie: `authorization_token=${incomingToken}`,
          Accept: "application/json",
          "User-Agent": "Appbox-Web/2.0"
        }
      }).catch(() => {})
    }
  } catch {
    // Ignore
  }

  const res = NextResponse.json({ success: true })
  for (const domain of domainsToClear) {
    // Some sessions have Strict from login and some have Lax from 2FA.
    res.cookies.set("authorization_token", "", {
      httpOnly: true,
      secure: secureForRequest,
      sameSite: "lax",
      path: "/",
      ...(domain ? { domain } : {}),
      maxAge: 0,
      expires: new Date(0)
    })
    ;(debugInfo.clearedVariants as Array<{ domain: string; sameSite: string }>).push(
      { domain: domain ?? "(host-only)", sameSite: "lax" }
    )
    res.cookies.set("authorization_token", "", {
      httpOnly: true,
      secure: secureForRequest,
      sameSite: "strict",
      path: "/",
      ...(domain ? { domain } : {}),
      maxAge: 0,
      expires: new Date(0)
    })
    ;(debugInfo.clearedVariants as Array<{ domain: string; sameSite: string }>).push(
      { domain: domain ?? "(host-only)", sameSite: "strict" }
    )
  }

  if (debugEnabled) {
    console.info("[auth/logout] debug", debugInfo)
    return NextResponse.json({ success: true, debug: debugInfo }, { headers: res.headers })
  }
  return res
}
