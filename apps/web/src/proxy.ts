import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

export function proxy(request: Parameters<typeof intlMiddleware>[0]) {
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
