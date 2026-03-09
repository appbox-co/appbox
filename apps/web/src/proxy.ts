import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { routing } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

// Dashboard routes that require authentication
const protectedPatterns = [
  "/dashboard",
  "/appboxmanager",
  "/account",
  "/appstore"
]

function isProtectedRoute(pathname: string): boolean {
  // Strip locale prefix if present
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    const token = request.cookies.get("authorization_token")?.value
    if (!token) {
      const locale = getLocaleFromPath(pathname)
      const loginPath = locale ? `/${locale}/login` : "/login"
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      url.searchParams.set("redirect", pathname)
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
    "/((?!api/|_next/|_proxy/|_vercel|authors|blog-images|fonts|_static|[^/]+\\.[^/]+$).*)",
    // Documentation, blog, and feed routes
    "/([\\w-]+)?/(docs|blog|feed)/(.+)",
    // Locale routes
    "/(en|de)/:path*",
    // Root path
    "/"
  ]
}
