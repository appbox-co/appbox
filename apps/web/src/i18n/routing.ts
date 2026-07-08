import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing-config"
export { dateLocales, localeNames, routing, supportedLocales } from "./routing-config"

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
