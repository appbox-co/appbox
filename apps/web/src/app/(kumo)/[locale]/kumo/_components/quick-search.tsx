"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"
import { CommandPalette } from "@cloudflare/kumo"
import { HardDrivesIcon } from "@phosphor-icons/react"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useRouter } from "@/i18n/routing"
import { AppIcon } from "./app-icon"
import type { StripApp } from "./app-strip"
import { kumoRoutes } from "./kumo-routes"

export interface SearchItem {
  id: string
  title: string
  /** Shown after the title in a quieter colour, e.g. the Appbox an app is on. */
  context?: string
  href: string
  external?: boolean
  icon: ReactNode
}

export interface SearchGroup {
  id: string
  label: string
  items: SearchItem[]
}

const COPY = {
  placeholder: "Search apps, Appboxes and pages",
  empty: "Nothing matches that search",
  apps: "Apps",
  appboxes: "Appboxes",
  navigate: "to navigate",
  select: "to open",
  newTab: "in a new tab"
} as const

/** Rows per group before the user types, and once they have. */
const IDLE_LIMIT = 6
const MATCH_LIMIT = 12

const QuickSearchContext = createContext<() => void>(() => {})

/** Returns a function that opens the quick search palette. */
export function useQuickSearch() {
  return useContext(QuickSearchContext)
}

/** Search entries for every installed app (pinned first) and every Appbox. */
export function buildSearchGroups(
  cylos: CyloSummary[],
  appsByCylo: ReadonlyMap<number, StripApp[]>,
  /** Sample-data mode: link to the demo twins of the ported pages. */
  demo = false
): SearchGroup[] {
  const routes = kumoRoutes(demo)
  const apps = cylos.flatMap((cylo) =>
    (appsByCylo.get(cylo.id) ?? []).map((app) => ({ app, cylo }))
  )
  // Stable sort, so pinned apps lead without reordering within each Appbox.
  apps.sort((a, b) => Number(b.app.pinned) - Number(a.app.pinned))

  return [
    {
      id: "apps",
      label: COPY.apps,
      items: apps.map(({ app, cylo }) => ({
        id: `app-${app.id}`,
        title: app.name,
        context: cylo.name,
        href: routes.installedApp(app.id),
        icon: <AppIcon icon={app.icon} name={app.name} />
      }))
    },
    {
      id: "appboxes",
      label: COPY.appboxes,
      items: cylos.map((cylo) => ({
        id: `cylo-${cylo.id}`,
        title: cylo.name,
        context: cylo.server_name,
        href: routes.appbox(cylo.id),
        icon: <HardDrivesIcon size={16} />
      }))
    }
  ]
}

function filterGroups(groups: SearchGroup[], query: string) {
  const needle = query.trim().toLowerCase()

  return groups
    .map((group) => ({
      ...group,
      items: needle
        ? group.items
            .filter((item) =>
              `${item.title} ${item.context ?? ""}`
                .toLowerCase()
                .includes(needle)
            )
            .slice(0, MATCH_LIMIT)
        : group.items.slice(0, IDLE_LIMIT)
    }))
    .filter((group) => group.items.length > 0)
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-kumo-hairline bg-kumo-base px-1.5 py-0.5 font-sans text-xs">
      {children}
    </kbd>
  )
}

interface QuickSearchProviderProps {
  groups: SearchGroup[]
  children: ReactNode
}

/**
 * Owns the ⌘K palette. Anything inside can open it with `useQuickSearch()`,
 * which is how the sidebar field and the home page search box trigger it.
 */
export function QuickSearchProvider({
  groups,
  children
}: QuickSearchProviderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const results = useMemo(() => filterGroups(groups, query), [groups, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  const go = (item: SearchItem, newTab: boolean) => {
    close()
    if (newTab || item.external) {
      window.open(item.href, "_blank", "noopener")
    } else {
      router.push(item.href)
    }
  }

  return (
    <QuickSearchContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandPalette.Root
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
        items={results}
        value={query}
        onValueChange={setQuery}
        itemToStringValue={(group) => group.label}
        getSelectableItems={(all) => all.flatMap((group) => group.items)}
        onSelect={(item, { newTab }) => go(item, newTab)}
      >
        <CommandPalette.Input
          placeholder={COPY.placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <CommandPalette.List>
          <CommandPalette.Results>
            {(group: SearchGroup) => (
              <CommandPalette.Group key={group.id} items={group.items}>
                <CommandPalette.GroupLabel>
                  {group.label}
                </CommandPalette.GroupLabel>
                <CommandPalette.Items>
                  {(item: SearchItem) => (
                    <CommandPalette.Item
                      key={item.id}
                      value={item}
                      onClick={(event) =>
                        go(item, event.metaKey || event.ctrlKey)
                      }
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-5 shrink-0 items-center justify-center text-kumo-subtle">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.title}</span>
                        {item.context && (
                          <span className="truncate text-kumo-subtle">
                            {item.context}
                          </span>
                        )}
                      </span>
                    </CommandPalette.Item>
                  )}
                </CommandPalette.Items>
              </CommandPalette.Group>
            )}
          </CommandPalette.Results>
          <CommandPalette.Empty>{COPY.empty}</CommandPalette.Empty>
        </CommandPalette.List>
        <CommandPalette.Footer>
          <span className="flex items-center gap-2">
            <Key>↑↓</Key>
            {COPY.navigate}
          </span>
          <span className="flex items-center gap-2">
            <Key>↵</Key>
            {COPY.select}
          </span>
          <span className="flex items-center gap-2">
            <Key>⌘↵</Key>
            {COPY.newTab}
          </span>
        </CommandPalette.Footer>
      </CommandPalette.Root>
    </QuickSearchContext.Provider>
  )
}
