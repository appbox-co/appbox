import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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
  const values = new Set<string | undefined>(
    normalizedCookieDomainsFromConfig()
  )
  const hostname = host.split(":")[0]?.toLowerCase() ?? ""

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

function serializeExpiredCookie(
  domain: string | undefined,
  sameSite: "lax" | "strict",
  secure: boolean
): string {
  const parts = [
    "authorization_token=",
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    `SameSite=${sameSite === "lax" ? "Lax" : "Strict"}`
  ]
  if (domain) parts.push(`Domain=${domain}`)
  if (secure) parts.push("Secure")
  return parts.join("; ")
}

export async function POST(request: NextRequest) {
  const incomingToken = request.cookies.get("authorization_token")?.value
  const host = request.headers.get("host") ?? ""
  const domainsToClear = normalizedCookieDomainsForHost(host)
  const secureForRequest =
    COOKIE_SECURE || request.nextUrl.protocol === "https:"

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
    // Best-effort backend signout; cookie clearing below is what matters.
  }

  // NextResponse.cookies.set() uses cookie name as a Map key, so repeated
  // calls for the same name silently overwrite previous entries — only the
  // LAST call would produce a Set-Cookie header.  Use headers.append()
  // directly so every domain × sameSite combination gets its own header.
  const res = NextResponse.json({ success: true })
  for (const domain of domainsToClear) {
    for (const sameSite of ["lax", "strict"] as const) {
      res.headers.append(
        "Set-Cookie",
        serializeExpiredCookie(domain, sameSite, secureForRequest)
      )
    }
  }
  return res
}
