import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { canOpenKumo, kumoAccess } from "@/config/kumo-access"
import { routing } from "@/i18n/routing-config"
import { fetchTokenUser } from "@/lib/auth/validate-token"

const intlMiddleware = createMiddleware(routing)

// Dashboard routes that require authentication
const protectedPatterns = [
  "/dashboard",
  "/appboxmanager",
  "/account",
  "/appstore"
]

function normalizeAuthPath(pathname: string): string {
  const locales = routing.locales as readonly string[]
  let path = pathname
  for (const locale of locales) {
    if (path.startsWith(`/${locale}/`)) {
      path = path.slice(locale.length + 1)
      break
    }
    if (path === `/${locale}`) {
      path = "/"
      break
    }
  }
  return path
}

function isProtectedRoute(pathname: string): boolean {
  const path = normalizeAuthPath(pathname)

  return protectedPatterns.some(
    (pattern) => path.startsWith(pattern) || path === pattern
  )
}

function getLocaleFromPath(pathname: string): string | null {
  const locales = routing.locales as readonly string[]
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale
    }
  }
  return null
}

/**
 * Whether a request is for a Kumo page. It reads the path as next-intl will
 * route it, decoded and cleaned the same way, so an encoded or padded path
 * (`/%6bumo`, `/ku%09mo`, `//kumo`) can't slip past. `kumo` counts as either
 * the first segment or the second, whatever comes before it: Next takes any
 * first segment as the `[locale]` of app/(kumo)/[locale]/kumo, so
 * `/fonts/kumo` is a Kumo page too until the layout refuses the locale. Any
 * live page with `kumo` as its second segment (none exists) would be gated the
 * same way. A path that can't be decoded counts as Kumo, so it is refused with
 * a 404 rather than let through.
 */
function isKumoRoute(pathname: string): boolean {
  let routed: string
  try {
    routed = decodeURI(pathname)
  } catch {
    return true
  }
  routed = routed
    .replace(/\\/g, "%5C")
    .replace(/[\t\n\r]/g, "")
    .replace(/\/+/g, "/")
  return /^\/(?:[^/]+\/)?kumo(?:\/|$)/.test(routed)
}

/** How long the Kumo check waits for the API before refusing. */
const KUMO_CHECK_TIMEOUT_MS = 5000

/**
 * The API allows `validate_token` 120 times per token and 60 per caller in 5
 * minutes, and one Kumo page view brings a dozen link prefetches. So the
 * proxy keeps each session's answer for a minute, keyed by a hash of its
 * token, and asks again after that. Requests that arrive while the answer is
 * on its way share it. A failed request (rate limit, server error, timeout) is
 * not kept, so the next request asks again.
 */
const KUMO_ANSWER_TTL_MS = 60_000
const KUMO_ANSWERS_MAX = 1000
const kumoAnswers = new Map<
  string,
  { answer: Promise<boolean>; expires: number }
>()

async function tokenKey(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

function rememberKumoAnswer(
  key: string,
  answer: Promise<boolean>,
  now: number
) {
  if (kumoAnswers.size >= KUMO_ANSWERS_MAX) {
    for (const [stored, entry] of kumoAnswers) {
      if (entry.expires <= now) kumoAnswers.delete(stored)
    }
    if (kumoAnswers.size >= KUMO_ANSWERS_MAX) kumoAnswers.clear()
  }
  kumoAnswers.set(key, { answer, expires: now + KUMO_ANSWER_TTL_MS })
  // A failure is not an answer: forget it, unless a newer request replaced it.
  answer.catch(() => {
    if (kumoAnswers.get(key)?.answer === answer) kumoAnswers.delete(key)
  })
}

/**
 * Whether this request may open the Kumo pages (config/kumo-access.ts). While
 * they are for admins only, the check runs here, before any Kumo code does.
 * If the API can't be asked in time, the answer is no.
 */
async function mayOpenKumo(token: string | undefined): Promise<boolean> {
  if (kumoAccess === "everyone") return true
  if (!token) return false

  const key = await tokenKey(token)
  const now = Date.now()
  let entry = kumoAnswers.get(key)
  if (!entry || entry.expires <= now) {
    const answer = fetchTokenUser(
      token,
      AbortSignal.timeout(KUMO_CHECK_TIMEOUT_MS)
    ).then((user) => canOpenKumo(user?.roles))
    rememberKumoAnswer(key, answer, now)
    entry = kumoAnswers.get(key)!
  }

  try {
    return await entry.answer
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("authorization_token")?.value

  // To anyone who may not open Kumo, its pages don't exist.
  if (isKumoRoute(pathname) && !(await mayOpenKumo(token))) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404
    })
  }

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    if (!token) {
      const locale = getLocaleFromPath(pathname)
      const loginPath = locale ? `/${locale}/login` : "/login"
      const url = request.nextUrl.clone()
      const redirectTarget = `${pathname}${request.nextUrl.search}`

      url.pathname = loginPath
      url.search = ""
      url.searchParams.set("redirect", redirectTarget)
      return NextResponse.redirect(url)
    }
  }

  // Run the intl middleware for all requests
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Match all paths except:
    // 1. API routes
    // 2. Next.js internals
    // 3. Static files with extensions
    // 4. /b5tg, the Google tag loader (rewritten in next.config.mjs)
    "/((?!api/|_next/|_proxy/|_vercel|authors|blog-images|blog-og|docs-images|fonts|_static|b5tg$|[^/]+\\.[^/]+$).*)",
    // Documentation, blog, and feed routes
    "/([\\w-]+)?/(docs|blog|feed)/(.+)",
    // Locale routes
    "/(en|de)/:path*",
    // Every Kumo page, so the Kumo check always runs: whatever the last
    // segment, and whatever the first, which the first entry may exclude
    "/kumo/:path*",
    "/:first/kumo/:path*",
    // Root path
    "/"
  ]
}
