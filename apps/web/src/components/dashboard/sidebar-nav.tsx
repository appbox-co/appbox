"use client"

import { useRef, useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

interface ChildNavItem {
  title: string
  href: string
  icon?: LucideIcon
  external?: boolean
}

interface NavItem {
  title: string
  href: string
  icon?: LucideIcon
  children?: ChildNavItem[]
  external?: boolean
}

interface SidebarNavProps {
  items: NavItem[]
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
}

export function SidebarNav({
  items,
  collapsed,
  pathname,
  onNavigate
}: SidebarNavProps) {
  return (
    <ul className="space-y-1 px-2">
      {items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  )
}

function SidebarNavItem({
  item,
  collapsed,
  pathname,
  onNavigate
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
}) {
  const isActive =
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    item.children?.some(
      (child) =>
        pathname === child.href || pathname.startsWith(child.href + "/")
    )

  const [expanded, setExpanded] = useState(isActive || false)
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const Icon = item.icon

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => setFlyoutOpen(false), 150)
  }

  // Shared icon styles
  const iconClass = cn(
    "size-5 shrink-0",
    isActive
      ? "text-[hsl(var(--sidebar-icon-active,234_89%_74%))]"
      : "text-[hsl(var(--sidebar-icon,218_13%_46%))]"
  )

  // Shared item base styles
  const itemBase = cn(
    "flex items-center gap-3 rounded-md px-3 h-[42px] text-sm font-medium transition-colors",
    "hover:bg-[hsl(var(--sidebar-hover,228_15%_17%))]",
    isActive
      ? "bg-[hsl(var(--sidebar-active,228_16%_20%))] text-[hsl(var(--sidebar-text-active,229_94%_82%))] border-l-2 border-l-primary"
      : "text-[hsl(var(--sidebar-text,var(--muted-foreground)))]"
  )

  // The full-width link/button used in expanded mode
  const expandedLink = (
    <Link
      href={item.children ? "#" : item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (item.children) {
          e.preventDefault()
          setExpanded(!expanded)
        } else {
          onNavigate?.()
        }
      }}
      className={itemBase}
    >
      {Icon && <Icon className={iconClass} />}
      <span className="flex-1 truncate">{item.title}</span>
      {item.external && !item.children && (
        <ExternalLink className="size-3 shrink-0 opacity-40" />
      )}
      {item.children && (
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            expanded && "rotate-180"
          )}
        />
      )}
    </Link>
  )

  // The icon-only element used as the collapsed trigger
  const collapsedIcon = (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-md transition-colors mx-auto",
        "hover:bg-[hsl(var(--sidebar-hover,228_15%_17%))]",
        isActive ? "bg-[hsl(var(--sidebar-active,228_16%_20%))]" : ""
      )}
    >
      {Icon && <Icon className={iconClass} />}
    </div>
  )

  return (
    <li>
      {collapsed ? (
        item.children ? (
          // Collapsed + has children → hover flyout showing sub-items
          <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
            <PopoverTrigger asChild>
              <div
                onMouseEnter={() => {
                  cancelClose()
                  setFlyoutOpen(true)
                }}
                onMouseLeave={scheduleClose}
                className="cursor-pointer"
              >
                {collapsedIcon}
              </div>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              sideOffset={8}
              align="start"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="w-48 p-1 bg-[hsl(var(--sidebar))] border-border shadow-lg"
            >
              {/* Flyout header — parent section name */}
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                {item.title}
              </p>
              {/* Separator */}
              <div className="my-1 mx-1 h-px bg-border" />
              <ul>
                {item.children.map((child) => {
                  const ChildIcon = child.icon
                  const childActive =
                    pathname === child.href ||
                    pathname.startsWith(child.href + "/")
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={() => {
                          setFlyoutOpen(false)
                          onNavigate?.()
                        }}
                        className={cn(
                          "flex items-center gap-3 h-[42px] rounded-md px-3 text-sm transition-colors",
                          "hover:bg-[hsl(var(--sidebar-hover,228_15%_17%))]",
                          childActive
                            ? "bg-[hsl(var(--sidebar-active,228_16%_20%))] text-[hsl(var(--sidebar-text-active,229_94%_82%))] font-medium"
                            : "text-[hsl(var(--sidebar-text,var(--muted-foreground)))]"
                        )}
                      >
                        {ChildIcon && (
                          <ChildIcon
                            className={cn(
                              "size-4 shrink-0",
                              childActive
                                ? "text-[hsl(var(--sidebar-icon-active,234_89%_74%))]"
                                : "text-[hsl(var(--sidebar-icon,218_13%_46%))]"
                            )}
                          />
                        )}
                        {child.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </PopoverContent>
          </Popover>
        ) : (
          // Collapsed + no children → same flyout panel style, header only
          <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
            <PopoverTrigger asChild>
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={onNavigate}
                onMouseEnter={() => {
                  cancelClose()
                  setFlyoutOpen(true)
                }}
                onMouseLeave={scheduleClose}
              >
                {collapsedIcon}
              </Link>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              sideOffset={8}
              align="start"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="w-auto p-1 bg-[hsl(var(--sidebar))] border-border shadow-lg"
            >
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => {
                  setFlyoutOpen(false)
                  onNavigate?.()
                }}
                className="flex items-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-[hsl(var(--sidebar-text-active,229_94%_82%))] transition-colors rounded-md hover:bg-[hsl(var(--sidebar-hover,228_15%_17%))] whitespace-nowrap"
              >
                {item.title}
              </Link>
            </PopoverContent>
          </Popover>
        )
      ) : (
        // Expanded mode — full label link/button
        expandedLink
      )}

      {/* Sub-items shown inline when expanded */}
      {!collapsed && item.children && expanded && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
          {item.children.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(child.href + "/")
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center h-[36px] rounded-md px-3 text-sm transition-colors",
                    "hover:bg-[hsl(var(--sidebar-hover,228_15%_17%))]",
                    childActive
                      ? "text-[hsl(var(--sidebar-text-active,229_94%_82%))] font-medium"
                      : "text-[hsl(var(--sidebar-text,var(--muted-foreground)))]"
                  )}
                >
                  {child.title}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
