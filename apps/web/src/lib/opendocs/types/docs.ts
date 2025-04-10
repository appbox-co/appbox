import type { LocaleOptions } from "./i18n"
import type { NavItem, NavItemWithChildren } from "./nav"

export interface DocsConfig {
  mainNav: NavItem[]
  sidebarNav: NavItemWithChildren[]
}

export interface DocPageProps {
  params: Promise<{
    slug: string[]
    locale: LocaleOptions
  }>
}
