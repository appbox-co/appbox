"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Plus, Server } from "lucide-react"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import { useMarketingScreenshotMode } from "@/components/marketing/use-marketing-screenshot-mode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useWebSocket } from "@/providers/websocket-provider"
import { CyloCard } from "./_components/cylo-card"

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex justify-center">
        <div className="size-20 rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-9 rounded bg-muted" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AppboxesPage() {
  const t = useTranslations("appboxmanager")
  const tc = useTranslations("common")
  const { data: cylos, isLoading, error } = useCylosSummary()
  const {
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  } = useWebSocket()
  const screenshotMode = useMarketingScreenshotMode()
  const visibleCylos = useMemo(
    () =>
      (cylos ?? []).filter(
        (c) => !(screenshotMode && c.server_name.toLowerCase() === "farm")
      ),
    [cylos, screenshotMode]
  )

  // Connect to every unique server, subscribe to each cylo channel, and
  // request 30d stats so bandwidth totals are always 30-day figures.
  useEffect(() => {
    if (!visibleCylos.length) return
    const servers = [
      ...new Set(visibleCylos.map((c) => c.server_name).filter(Boolean))
    ]
    connectToServers(servers)
    visibleCylos.forEach((c) => {
      const channel = `cylo:${c.id}`
      subscribe(channel)
      // Ask the gateway to use the 30d range for this cylo so both the
      // network_history fallback and the INTEGRAL query cover 30 days.
      sendToServer(
        { action: "stats_range", channel, range: "30d" },
        c.server_name
      )
    })
    return () => {
      visibleCylos.forEach((c) => unsubscribe(`cylo:${c.id}`))
      servers.forEach((name) => disconnectFromServer(name))
    }
  }, [
    visibleCylos,
    connectToServers,
    disconnectFromServer,
    subscribe,
    unsubscribe,
    sendToServer
  ])

  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    let result = [...visibleCylos]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.server_name.toLowerCase().includes(q)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((c) => {
        if (statusFilter === "migrating") return c.is_migrating
        if (statusFilter === "throttled") return c.is_throttled
        if (statusFilter === "low-quota") return c.is_low_quota
        return c.status === statusFilter
      })
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "server") return a.server_name.localeCompare(b.server_name)
      if (sortBy === "storage") {
        const aPercent =
          a.storage_total > 0 ? a.storage_used / a.storage_total : 0
        const bPercent =
          b.storage_total > 0 ? b.storage_used / b.storage_total : 0
        return bPercent - aPercent
      }
      return 0
    })

    return result
  }, [visibleCylos, search, sortBy, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("cylos.title")}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={`${t("cylos.name")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("cylos.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("cylos.name")}</SelectItem>
              <SelectItem value="server">{t("cylos.server")}</SelectItem>
              <SelectItem value="storage">{t("cylos.storage")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("cylos.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cylos.allStatuses")}</SelectItem>
              <SelectItem value="online">{tc("status.online")}</SelectItem>
              <SelectItem value="offline">{tc("status.offline")}</SelectItem>
              <SelectItem value="migrating">
                {tc("status.migrating")}
              </SelectItem>
              <SelectItem value="throttled">
                {tc("status.throttled")}
              </SelectItem>
              <SelectItem value="low-quota">{tc("status.lowQuota")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Server className="size-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tc("errors.loadAppboxesFailed")}
          </p>
        </div>
      ) : filtered.length === 0 && !search && statusFilter === "all" ? (
        /* Empty state - no cylos at all */
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <Server className="size-14 text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">{t("cylos.empty")}</p>
            <p className="text-sm text-muted-foreground">
              {tc("empty.noAppboxes")}
            </p>
          </div>
          <Button asChild>
            <a
              href="https://billing.appbox.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Plus className="mr-1.5 size-4" />
              {t("cylos.getCylo")}
            </a>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state - filtered results */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Server className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tc("empty.noMatchingAppboxes")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cylo) => (
            <CyloCard key={cylo.id} cylo={cylo} />
          ))}
        </div>
      )}
    </div>
  )
}
