"use client"

import {
  createContext,
  Fragment,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import {
  Badge,
  Breadcrumbs,
  Button,
  cn,
  DropdownMenu,
  LinkButton,
  Sidebar,
  Tooltip,
  useSidebar
} from "@cloudflare/kumo"
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  HardDrivesIcon,
  HouseIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusCircleIcon,
  PulseIcon,
  ShieldCheckIcon,
  SignOutIcon,
  StorefrontIcon,
  SunIcon,
  UserCircleIcon,
  type Icon
} from "@phosphor-icons/react"
import { createPortal } from "react-dom"
import { Icons } from "@/components/shared/icons"
import { ROUTES } from "@/constants/routes"
import { usePathname } from "@/i18n/routing"
import { kumoRoutes, KumoRoutesProvider, useKumoRoutes } from "./kumo-routes"
import {
  QuickSearchProvider,
  useQuickSearch,
  type SearchGroup
} from "./quick-search"

interface NavLink {
  label: string
  href: string
  external?: boolean
}

type NavItem = NavLink & { icon: Icon }

/** A parent that opens inline to show its pages, as in Cloudflare's sidebar. */
interface NavSection {
  label: string
  icon: Icon
  children: NavLink[]
}

interface NavGroup {
  label?: string
  items: (NavItem | NavSection)[]
}

function isSection(item: NavItem | NavSection): item is NavSection {
  return "children" in item
}

export interface AppShellUser {
  name: string
  email: string
}

const RailContext = createContext<HTMLElement | null>(null)
const BarContext = createContext<HTMLElement | null>(null)

/** Hides an in-page fallback once the right-hand column is docked. */
export const RAIL_FALLBACK = "@min-[91rem]/shell:hidden"

/**
 * Puts its children in the shell's right-hand column, which docks to the edge
 * of the window once there is room for it (so sooner with the sidebar
 * collapsed). Pair it with a fallback in the page marked `RAIL_FALLBACK`, which
 * hides at the same point.
 */
export function ShellRail({ children }: { children: ReactNode }) {
  const rail = useContext(RailContext)
  return rail ? createPortal(children, rail) : null
}

/**
 * Puts its children in the band under the shell's top bar: tabs at the start,
 * the page's main actions at the end.
 */
export function ShellBar({ children }: { children: ReactNode }) {
  const bar = useContext(BarContext)
  return bar ? createPortal(children, bar) : null
}

interface AppShellProps {
  user: AppShellUser
  /** Current page name, shown as the last breadcrumb. Omit on the home page. */
  title?: string
  /** Pages between the home crumb and `title`, e.g. the App Store above an app. */
  parents?: { label: string; href: string }[]
  /**
   * Content column, matching Cloudflare's dashboard: `narrow` (1000px, as on
   * the account home) or `wide` (1400px, as on catalogue and list pages).
   */
  width?: "narrow" | "wide"
  /** Sample-data mode: ported pages link to their demo twins, which need no session. */
  demo?: boolean
  /** The same page in the current design, for the comparison link. */
  currentDesignHref?: string
  /** Page-specific quick search entries (apps, Appboxes). Pages are added here. */
  search?: SearchGroup[]
  onSignOut?: () => void
  children: React.ReactNode
}

const COPY = {
  quickSearch: "Quick search",
  goTo: "Go to"
} as const

const SIDEBAR_KEY = "kumo-sidebar-open"
const SIDEBAR_EVENT = "kumo-sidebar-change"

function subscribeToSidebar(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(SIDEBAR_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(SIDEBAR_EVENT, callback)
  }
}

function readSidebarOpen() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "false"
  } catch {
    return true
  }
}

/** Sidebar open state, remembered across visits. Open until the user minimises it. */
function useSidebarOpen() {
  const open = useSyncExternalStore(
    subscribeToSidebar,
    readSidebarOpen,
    () => true
  )
  const setOpen = (next: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(next))
    } catch {
      // Private mode or blocked storage: the choice just lasts for this page.
    }
    window.dispatchEvent(new Event(SIDEBAR_EVENT))
  }
  return [open, setOpen] as const
}

/** Below this width Kumo shows the sidebar as an off-canvas sheet. */
const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobile(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}

const subscribeNoop = () => () => {}

/** False during SSR and hydration, true afterwards. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
}

function Brand() {
  const { state } = useSidebar()

  if (state === "collapsed") {
    return (
      <span
        aria-label="Appbox"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-kumo-contrast text-sm font-semibold text-kumo-inverse"
      >
        A
      </span>
    )
  }

  return <Icons.sitename className="ms-1 h-5 w-auto text-kumo-default" />
}

/** Sidebar entry point to the ⌘K palette: a field when open, an icon when collapsed. */
function SidebarSearch() {
  const openSearch = useQuickSearch()
  const { state } = useSidebar()

  if (state === "collapsed") {
    // MenuButton renders a list item, so it needs a Menu around it.
    return (
      <Sidebar.Menu>
        <Sidebar.MenuButton icon={MagnifyingGlassIcon} onClick={openSearch}>
          {COPY.quickSearch}
        </Sidebar.MenuButton>
      </Sidebar.Menu>
    )
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="kumo-search-surface flex h-8.5 w-full cursor-pointer items-center gap-2 rounded-lg bg-kumo-base px-2.5 text-left text-kumo-placeholder ring ring-kumo-line outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand"
    >
      <MagnifyingGlassIcon size={16} className="shrink-0 text-kumo-subtle" />
      <span className="min-w-0 flex-1 truncate">{COPY.quickSearch}</span>
      <kbd aria-hidden="true" className="font-sans text-xs text-kumo-subtle">
        ⌘K
      </kbd>
    </button>
  )
}

/** The sidebar is an off-canvas sheet on small screens, so it needs a top bar toggle. */
function MobileSidebarTrigger() {
  const { isMobile } = useSidebar()
  return isMobile ? <Sidebar.Trigger /> : null
}

export function ThemeToggle() {
  const t = useTranslations("dashboard.header")
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = !mounted || resolvedTheme === "dark"
  const label = isDark ? t("theme_light") : t("theme_dark")

  return (
    <Tooltip
      content={label}
      render={
        <Button
          variant="ghost"
          shape="square"
          aria-label={label}
          icon={isDark ? SunIcon : MoonIcon}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        />
      }
    />
  )
}

function UserMenu({
  user,
  onSignOut
}: {
  user: AppShellUser
  onSignOut?: () => void
}) {
  const t = useTranslations("dashboard.header")
  const routes = useKumoRoutes()
  const initial = user.name.charAt(0).toUpperCase() || "?"

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button variant="secondary" shape="circle" aria-label={t("profile")}>
            {initial}
          </Button>
        }
      />
      <DropdownMenu.Content>
        <div className="grid gap-0.5 px-2 py-1.5">
          <span className="truncate font-medium">{user.name}</span>
          <span className="truncate text-kumo-subtle">{user.email}</span>
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.LinkItem href={routes.profile} icon={UserCircleIcon}>
          {t("profile")}
        </DropdownMenu.LinkItem>
        <DropdownMenu.LinkItem href={routes.twoFactor} icon={ShieldCheckIcon}>
          {t("security")}
        </DropdownMenu.LinkItem>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          icon={SignOutIcon}
          variant="danger"
          onClick={onSignOut}
        >
          {t("sign_out")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

export function AppShell({
  user,
  title,
  parents = [],
  width = "wide",
  demo = false,
  currentDesignHref = ROUTES.DASHBOARD,
  search = [],
  onSignOut,
  children
}: AppShellProps) {
  const t = useTranslations("dashboard.sidebar")
  const pathname = usePathname()
  const routes = kumoRoutes(demo)

  const groups: NavGroup[] = [
    {
      items: [
        { label: t("dashboard"), href: routes.home, icon: HouseIcon },
        { label: t("appstore"), href: routes.appStore, icon: StorefrontIcon }
      ]
    },
    {
      label: "Manage",
      items: [
        {
          label: t("appboxes"),
          icon: HardDrivesIcon,
          children: [
            { label: t("appboxes"), href: routes.appboxes },
            { label: t("installed_apps"), href: routes.installedApps },
            { label: t("domains"), href: routes.domains }
          ]
        },
        {
          label: t("account"),
          icon: UserCircleIcon,
          children: [
            { label: t("profile"), href: routes.profile },
            { label: t("two_factor"), href: routes.twoFactor },
            { label: t("api_keys"), href: routes.apiKeys },
            { label: t("abuse_reports"), href: routes.abuseReports }
          ]
        },
        { label: t("add_appbox"), href: "/", icon: PlusCircleIcon }
      ]
    },
    {
      label: "Help",
      items: [
        {
          label: t("service_status"),
          href: "https://status.appbox.co/",
          icon: PulseIcon,
          external: true
        },
        {
          label: t("support_billing"),
          href: "https://billing.appbox.co/",
          icon: LifebuoyIcon,
          external: true
        },
        {
          label: t("knowledgebase"),
          href: "https://billing.appbox.co/index.php?rp=/knowledgebase",
          icon: BookOpenIcon,
          external: true
        }
      ]
    }
  ]

  // Exact match only for the demo home, whose path prefixes the other demo pages.
  const isActive = (link: NavLink) =>
    pathname === link.href ||
    (link.href !== routes.home && pathname.startsWith(`${link.href}/`))

  const searchGroups: SearchGroup[] = [
    ...search,
    {
      id: "pages",
      label: COPY.goTo,
      items: groups.flatMap((group) =>
        group.items.flatMap((item) =>
          isSection(item)
            ? item.children.map((child) => ({
                id: `page-${child.href}`,
                title: child.label,
                context: item.label,
                href: child.href,
                external: child.external,
                icon: <item.icon size={16} />
              }))
            : [
                {
                  id: `page-${item.href}`,
                  title: item.label,
                  href: item.href,
                  external: item.external,
                  icon: <item.icon size={16} />
                }
              ]
        )
      )
    }
  ]

  // The remembered state is for the desktop rail only. On small screens the
  // sidebar is a sheet that should start closed on every page.
  const isMobile = useIsMobile()
  const [desktopOpen, setDesktopOpen] = useSidebarOpen()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [rail, setRail] = useState<HTMLElement | null>(null)
  const [bar, setBar] = useState<HTMLElement | null>(null)

  return (
    <KumoRoutesProvider demo={demo}>
      <QuickSearchProvider groups={searchGroups}>
        {/*
        As on Cloudflare's dashboard: the sidebar sits on the page canvas, and
        when minimised it expands over the page while hovered or focused
        (`peekable`) instead of opening a flyout per icon.
      */}
        <Sidebar.Provider
          open={isMobile ? mobileOpen : desktopOpen}
          onOpenChange={isMobile ? setMobileOpen : setDesktopOpen}
          mobileBreakpoint={MOBILE_BREAKPOINT}
          peekable
          className="h-svh overflow-clip [--sidebar-bg:var(--color-kumo-canvas)]"
        >
          <Sidebar>
            <Sidebar.Header>
              <Brand />
            </Sidebar.Header>
            <Sidebar.Content>
              <div className="pb-2">
                <SidebarSearch />
              </div>
              {groups.map((group, index) => (
                <Sidebar.Group key={group.label ?? index}>
                  {group.label && (
                    <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
                  )}
                  <Sidebar.Menu>
                    {group.items.map((item) =>
                      isSection(item) ? (
                        <Sidebar.MenuItem key={item.label}>
                          <Sidebar.Collapsible
                            defaultOpen={item.children.some(isActive)}
                          >
                            <Sidebar.CollapsibleTrigger
                              render={
                                <Sidebar.MenuButton icon={item.icon}>
                                  {item.label}
                                  <Sidebar.MenuChevron />
                                </Sidebar.MenuButton>
                              }
                            />
                            <Sidebar.CollapsibleContent>
                              <Sidebar.MenuSub>
                                {item.children.map((child) => (
                                  <Sidebar.MenuSubButton
                                    key={child.href}
                                    href={child.href}
                                    active={isActive(child)}
                                  >
                                    {child.label}
                                  </Sidebar.MenuSubButton>
                                ))}
                              </Sidebar.MenuSub>
                            </Sidebar.CollapsibleContent>
                          </Sidebar.Collapsible>
                        </Sidebar.MenuItem>
                      ) : (
                        <Sidebar.MenuButton
                          key={item.href}
                          icon={item.icon}
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          active={isActive(item)}
                        >
                          {item.label}
                          {item.external && (
                            <ArrowUpRightIcon
                              aria-hidden="true"
                              size={14}
                              className="ms-auto shrink-0 text-kumo-subtle"
                            />
                          )}
                        </Sidebar.MenuButton>
                      )
                    )}
                  </Sidebar.Menu>
                </Sidebar.Group>
              ))}
            </Sidebar.Content>
            <Sidebar.Footer>
              <Sidebar.Trigger />
            </Sidebar.Footer>
          </Sidebar>

          <div className="flex h-svh min-w-0 flex-1 flex-col">
            <header className="flex h-[58px] shrink-0 items-center gap-2 border-b border-kumo-line px-3">
              <MobileSidebarTrigger />
              <div className="min-w-0 flex-1">
                {title && (
                  <Breadcrumbs size="sm">
                    <Breadcrumbs.Link href={routes.home}>
                      Appbox
                    </Breadcrumbs.Link>
                    <Breadcrumbs.Separator />
                    {parents.map((parent) => (
                      <Fragment key={parent.href}>
                        <Breadcrumbs.Link href={parent.href}>
                          {parent.label}
                        </Breadcrumbs.Link>
                        <Breadcrumbs.Separator />
                      </Fragment>
                    ))}
                    <Breadcrumbs.Current>{title}</Breadcrumbs.Current>
                  </Breadcrumbs>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="beta" className="hidden sm:inline-flex">
                  Kumo prototype
                </Badge>
                <LinkButton
                  href={currentDesignHref}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Current design
                </LinkButton>
                <ThemeToggle />
                <UserMenu user={user} onSignOut={onSignOut} />
              </div>
            </header>

            {/* A band for a page's tabs and main actions, as on Cloudflare's
                detail pages. Pages fill it through <ShellBar>; it takes no
                room while empty. */}
            <div
              ref={setBar}
              className="hidden min-h-13 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-kumo-line px-4 py-2 not-empty:flex sm:px-5"
            />

            <div className="@container/shell flex min-h-0 flex-1">
              <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
                {/* Padding sits outside the column so its max width is the content width. */}
                <div
                  className={cn(
                    "mx-auto w-full",
                    width === "narrow" ? "max-w-[1000px]" : "max-w-[1400px]"
                  )}
                >
                  <BarContext.Provider value={bar}>
                    <RailContext.Provider value={rail}>
                      {children}
                    </RailContext.Provider>
                  </BarContext.Provider>
                </div>
              </main>
              {/* Right-hand column, as on Cloudflare's list pages. Pages fill
                  it through <ShellRail>. It takes no room while empty, or
                  until the area beside the sidebar is wide enough (91rem)
                  that docking it does not squeeze the page. */}
              <aside
                ref={setRail}
                className="hidden w-80 shrink-0 overflow-y-auto border-s border-kumo-line @min-[91rem]/shell:not-empty:block"
              />
            </div>
          </div>
        </Sidebar.Provider>
      </QuickSearchProvider>
    </KumoRoutesProvider>
  )
}
