export { default } from "@/lib/opendocs/middleware"

export const config = {
  matcher: [
    // Match all paths except:
    // 1. API routes
    // 2. Next.js internals
    // 3. Static files with extensions
    "/((?!api/|_next/|_proxy/|_vercel|authors|fonts|_static|[^/]+\\.[^/]+$).*)",
    // Documentation, blog, and feed routes
    "/([\\w-]+)?/(docs|blog|feed)/(.+)",
    // Locale routes
    "/(en|de)/:path*",
    // Root path
    "/"
  ]
}
