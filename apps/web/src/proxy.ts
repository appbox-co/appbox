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
 * (`/%6bumo`, `/ku%09mo`, `//kumo`) can't slip past. A path that can't be
 * decoded counts as Kumo, so it is refused rather than let through.
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
  const path = normalizeAuthPath(routed)
  return path === "/kumo" || path.startsWith("/kumo/")
}

/** How long the Kumo check waits for the API before refusing. */
const KUMO_CHECK_TIMEOUT_MS = 5000

/**
 * Whether this request may open the Kumo pages (config/kumo-access.ts). While
 * they are for admins only, the check runs here, before any Kumo code does.
 * If the API can't be asked in time, the answer is no.
 */
async function mayOpenKumo(token: string | undefined): Promise<boolean> {
  if (kumoAccess === "everyone") return true
  if (!token) return false
  try {
    const user = await fetchTokenUser(
      token,
      AbortSignal.timeout(KUMO_CHECK_TIMEOUT_MS)
    )
    return canOpenKumo(user?.roles)
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
    // Every Kumo page, whatever its last segment, so the Kumo check always runs
    "/kumo/:path*",
    "/:locale/kumo/:path*",
    // Root path
    "/"
  ]
}
