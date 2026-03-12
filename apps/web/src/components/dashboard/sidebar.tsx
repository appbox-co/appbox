"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Activity,
  AlertTriangle,
  AppWindow,
  ArrowRightLeft,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  Grid3x3,
  HardDrive,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Network,
  Package,
  PlusCircle,
  Rocket,
  Server,
  Settings,
  Shield,
  ShieldBan,
  Store,
  Tag,
  User,
  UserCircle,
  Users
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ROUTES } from "@/constants/routes"
import { Link, usePathname } from "@/i18n/routing"
import { ADMIN_MODULE_AVAILABLE } from "@/lib/admin/availability"
import type { AdminMenuItem } from "@/lib/admin/bridge"
import { cn } from "@/lib/utils"
import { useAdminMode } from "@/providers/admin-mode-provider"
import { useAuth } from "@/providers/auth-provider"
import { SidebarNav } from "./sidebar-nav"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserCircle,
  MessageSquare,
  HardDrive,
  ArrowRightLeft,
  Server,
  Rocket,
  AlertTriangle,
  Activity,
  Gauge,
  Building2,
  Globe,
  Settings,
  Tag,
  ShieldBan,
  Mail,
  Package,
  Network,
  Store,
  AppWindow,
  Grid3x3,
  Shield
}

function syncLayout(isCollapsed: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("sidebar-is-collapsed", isCollapsed)
}

const MARKETING_WIDGET_SELECTORS = [
  "#iubenda-cs-banner",
  ".iubenda-cs-container",
  '[id^="iubenda"]',
  '[class*="iubenda-cs"]',
  ".woot-widget-holder",
  ".woot--bubble-holder",
  ".woot-widget-bubble"
]

function removeMarketingWidgets() {
  MARKETING_WIDGET_SELECTORS.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove())
  })
  try {
    const iub = (window as Window & { _iub?: { cs?: { api?: { close?: () => void } } } })
      ._iub
    iub?.cs?.api?.close?.()
  } catch {
    /* empty */
  }
}

function useHideMarketingWidgets() {
  useEffect(() => {
    document.documentElement.classList.add("dashboard-layout")
    removeMarketingWidgets()

    const observer = new MutationObserver((mutations) => {
      const hasRelevantAddition = mutations.some((m) =>
        Array.from(m.addedNodes).some(
          (node) =>
            node instanceof Element &&
            MARKETING_WIDGET_SELECTORS.some((sel) => node.matches(sel))
        )
      )
      if (hasRelevantAddition) removeMarketingWidgets()
    })
    observer.observe(document.body, { childList: true })

    return () => {
      observer.disconnect()
      document.documentElement.classList.remove("dashboard-layout")
    }
  }, [])
}

function mapRegistryToNavItems(
  menu: AdminMenuItem[]
): { title: string; href: string; icon?: LucideIcon; children?: { title: string; href: string; icon?: LucideIcon }[] }[] {
  return menu.map((item) => ({
    title: item.label,
    href: item.href,
    icon: ICON_MAP[item.iconKey],
    children: item.children?.map((child) => ({
      title: child.label,
      href: child.href,
      icon: ICON_MAP[child.iconKey]
    }))
  }))
}

interface DashboardSidebarProps {
  mobile?: boolean
  onNavigate?: () => void
}

export function DashboardSidebar({
  mobile = false,
  onNavigate
}: DashboardSidebarProps) {
  const t = useTranslations("dashboard.sidebar")
  const { user } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isAdminMode } = useAdminMode()
  useHideMarketingWidgets()
  const canAccessAdmin = user.roles === "admin"

  const [adminMenu, setAdminMenu] = useState<AdminMenuItem[] | null>(null)

  useEffect(() => {
    if (!canAccessAdmin || !ADMIN_MODULE_AVAILABLE) return
    import("@/lib/admin/bridge").then((mod) => {
      mod.loadAdminModule().then((result) => {
        if (result.registry) {
          setAdminMenu(result.registry.menu)
        }
      })
    })
  }, [canAccessAdmin])

  useEffect(() => {
    if (mobile) return
    const stored = localStorage.getItem("sidebar-collapsed")
    const initial = stored === null ? true : stored === "true"
    queueMicrotask(() => {
      setCollapsed(initial)
      syncLayout(initial)
    })
  }, [mobile])

  const toggleCollapsed = () => {
    if (mobile) return
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
    syncLayout(next)
  }

  const userNavItems = [
    {
      title: t("dashboard"),
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard
    },
    {
      title: t("appstore"),
      href: ROUTES.APP_STORE,
      icon: Store
    },
    {
      title: t("appboxes"),
      href: ROUTES.APPBOXES,
      icon: Server,
      children: [
        { title: t("appboxes"), href: ROUTES.APPBOXES, icon: Server },
        {
          title: t("installed_apps"),
          href: ROUTES.INSTALLED_APPS,
          icon: Rocket
        },
        { title: t("domains"), href: ROUTES.DOMAINS, icon: Globe }
      ]
    },
    {
      title: t("account"),
      href: ROUTES.PROFILE,
      icon: User,
      children: [
        { title: t("profile"), href: ROUTES.PROFILE, icon: UserCircle },
        {
          title: t("abuse_reports"),
          href: ROUTES.ABUSE_REPORTS,
          icon: AlertTriangle
        },
        { title: t("two_factor"), href: ROUTES.TWO_FACTOR_SETUP, icon: Shield }
      ]
    },
    {
      title: t("service_status"),
      href: "https://status.appbox.co/",
      icon: Activity,
      external: true
    },
    {
      title: t("support_billing"),
      href: "https://billing.appbox.co/",
      icon: HelpCircle,
      external: true
    },
    {
      title: t("add_appbox"),
      href: "/",
      icon: PlusCircle
    },
    {
      title: t("knowledgebase"),
      href: "https://billing.appbox.co/index.php?rp=/knowledgebase",
      icon: BookOpen,
      external: true
    }
  ]

  const adminNavItems = useMemo(
    () => (adminMenu ? mapRegistryToNavItems(adminMenu) : []),
    [adminMenu]
  )

  const navItems =
    isAdminMode && canAccessAdmin && adminNavItems.length > 0
      ? adminNavItems
      : userNavItems

  const avatarInitial =
    user.alias?.[0]?.toUpperCase() || user.email[0].toUpperCase()

  const sidebarContent = (
    <>
      <div
        className={cn(
          "flex h-[75px] items-center border-b border-border",
          collapsed ? "justify-center" : "px-4"
        )}
      >
        {!collapsed && (
          <Link
            href={isAdminMode ? ROUTES.DASHBOARD_ADMIN : ROUTES.DASHBOARD}
            className="flex items-center gap-3"
            onClick={onNavigate}
          >
            <div
              data-anonymize-initial
              className={cn(
                "flex size-10 items-center justify-center rounded-lg text-white font-bold text-sm shadow-sm",
                isAdminMode ? "bg-primary" : "gradient-badge"
              )}
            >
              {isAdminMode ? (
                <Shield className="size-5" />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="flex flex-col">
              <span
                data-anonymize
                className="text-sm font-medium text-foreground truncate max-w-[150px]"
              >
                {isAdminMode ? "Admin Panel" : (user.alias || user.email)}
              </span>
              <span data-anonymize className="text-xs text-muted-foreground">
                {isAdminMode ? user.email : user.email}
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div
            data-anonymize-initial
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm shadow-sm",
              isAdminMode ? "bg-primary" : "gradient-badge"
            )}
          >
            {isAdminMode ? (
              <Shield className="size-5" />
            ) : (
              avatarInitial
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <SidebarNav
          items={navItems}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      {!mobile && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-md px-3 h-[42px] text-sm text-muted-foreground",
              "transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-foreground",
              collapsed ? "justify-center" : "justify-center gap-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="size-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  )

  if (mobile) {
    return (
      <div className="flex h-full flex-col bg-[hsl(var(--sidebar))] border-r border-border">
        {sidebarContent}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col",
        "bg-[hsl(var(--sidebar))] border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-[250px]"
      )}
    >
      {sidebarContent}
    </aside>
  )
}
