import type { LocaleOptions } from "./i18n"
import type { NavItem, SidebarNavItem } from "./nav"

export interface DocsConfig {
  mainNav: NavItem[]
  sidebarNav: SidebarNavItem[]
}

export interface DocPageProps {
  params: {
    slug: string[]
    locale: LocaleOptions
  }
}
