"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Globe,
  HelpCircle,
  LayoutDashboard,
  PlusCircle,
  Rocket,
  Server,
  Shield,
  Store,
  User,
  UserCircle
} from "lucide-react"
import { ROUTES } from "@/constants/routes"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { SidebarNav } from "./sidebar-nav"

function syncLayout(isCollapsed: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("sidebar-is-collapsed", isCollapsed)
}

const MARKETING_WIDGET_SELECTORS = [
  // iubenda — cookie banner, container, any injected root element
  "#iubenda-cs-banner",
  ".iubenda-cs-container",
  '[id^="iubenda"]',
  '[class*="iubenda-cs"]',
  // chatwoot
  ".woot-widget-holder",
  ".woot--bubble-holder",
  ".woot-widget-bubble"
]

function removeMarketingWidgets() {
  MARKETING_WIDGET_SELECTORS.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove())
  })
  // Ask iubenda's own API to close if still initialising
  try {
    const iub = (window as Window & { _iub?: { cs?: { api?: { close?: () => void } } } })
      ._iub
    iub?.cs?.api?.close?.()
  } catch {
    // Ignore if iubenda is unavailable
  }
}

function useHideMarketingWidgets() {
  useEffect(() => {
    document.documentElement.classList.add("dashboard-layout")
    removeMarketingWidgets()

    // Watch for widgets being re-injected into <body> after SPA navigation
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
  useHideMarketingWidgets()

  useEffect(() => {
    if (mobile) return
    const stored = localStorage.getItem("sidebar-collapsed")
    // Default to collapsed if nothing stored yet
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

  const navItems = [
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

  const avatarInitial =
    user.alias?.[0]?.toUpperCase() || user.email[0].toUpperCase()

  const sidebarContent = (
    <>
      {/* Logo / Avatar area */}
      <div
        className={cn(
          "flex h-[75px] items-center border-b border-border",
          collapsed ? "justify-center" : "px-4"
        )}
      >
        {!collapsed && (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-3"
            onClick={onNavigate}
          >
            <div
              data-anonymize-initial
              className="gradient-badge flex size-10 items-center justify-center rounded-lg text-white font-bold text-sm shadow-sm"
            >
              {avatarInitial}
            </div>
            <div className="flex flex-col">
              <span
                data-anonymize
                className="text-sm font-medium text-foreground truncate max-w-[150px]"
              >
                {user.alias || user.email}
              </span>
              <span data-anonymize className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div
            data-anonymize-initial
            className="gradient-badge flex size-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm shadow-sm"
          >
            {avatarInitial}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <SidebarNav
          items={navItems}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      {/* Collapse button (desktop only) */}
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

  // Mobile variant: render without fixed positioning so it works inside Sheet
  if (mobile) {
    return (
      <div className="flex h-full flex-col bg-[hsl(var(--sidebar))] border-r border-border">
        {sidebarContent}
      </div>
    )
  }

  // Desktop variant: fixed sidebar
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
