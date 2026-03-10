"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Play, RotateCcw, Square, Star } from "lucide-react"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import {
  useInstalledApps,
  useRestartApp,
  useStartApp,
  useStopApp,
  type InstalledApp
} from "@/api/installed-apps/hooks/use-installed-apps"
import { usePinApp } from "@/api/pinned-apps/hooks/use-pinned-apps"
import { getPinnedApps, unpinApp } from "@/api/pinned-apps/pinned-apps"
import type { PinnedApp } from "@/api/pinned-apps/pinned-apps"
import { DataTable } from "@/components/dashboard/data-table/data-table"
import type { FacetedFilterConfig } from "@/components/dashboard/data-table/data-table"
import {
  DateCell,
  ImageCell,
  StatusCell
} from "@/components/dashboard/data-table/data-table-cells"
import type { FacetedFilterOption } from "@/components/dashboard/data-table/data-table-faceted-filter"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { InstalledAppDevPanel } from "./_components/installed-app-dev-panel"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

/* -------------------------------------------------------------------------- */
/*  Status options                                                             */
/* -------------------------------------------------------------------------- */

const STATUS_DOT_COLORS: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  inactive: "bg-zinc-500",
  migrating: "bg-amber-500",
  installing: "bg-blue-500",
  updating: "bg-blue-500",
  deleting: "bg-red-500"
}

const STATUS_OPTIONS: FacetedFilterOption[] = [
  "online",
  "offline",
  "inactive",
  "migrating",
  "installing",
  "updating",
  "deleting"
].map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
  icon: (
    <span
      className={cn(
        "size-2 rounded-full",
        STATUS_DOT_COLORS[s] ?? "bg-zinc-500"
      )}
    />
  )
}))

function isTransitioningStatus(status: string): boolean {
  return (
    status === "migrating" ||
    status === "installing" ||
    status === "updating" ||
    status === "deleting"
  )
}

function isEligibleForBulkAction(
  app: InstalledApp,
  action: "start" | "stop" | "restart"
): boolean {
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isTransitioning = isTransitioningStatus(app.status)

  if (action === "start") return !isTransitioning && isStopped
  if (action === "stop") return !isTransitioning && app.status === "online"
  return !isTransitioning && !isStopped
}

/* -------------------------------------------------------------------------- */
/*  Inline action buttons                                                      */
/* -------------------------------------------------------------------------- */

function RowActions({ app }: { app: InstalledApp }) {
  const t = useTranslations("appboxmanager.appDetail")
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()

  const isRunning = app.status === "online"
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isTransitioning =
    app.status === "migrating" ||
    app.status === "installing" ||
    app.status === "updating" ||
    app.status === "deleting"

  const handleAction = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Start */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={isRunning || isTransitioning || startMutation.isPending}
              onClick={(e) =>
                handleAction(e, () => startMutation.mutate(app.id))
              }
            >
              {startMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("start")}</TooltipContent>
        </Tooltip>

        {/* Stop */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={isStopped || isTransitioning || stopMutation.isPending}
              onClick={(e) =>
                handleAction(e, () => stopMutation.mutate(app.id))
              }
            >
              {stopMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Square className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("stop")}</TooltipContent>
        </Tooltip>

        {/* Restart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={
                isStopped || isTransitioning || restartMutation.isPending
              }
              onClick={(e) =>
                handleAction(e, () => restartMutation.mutate(app.id))
              }
            >
              {restartMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("restart")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pin action button                                                          */
/* -------------------------------------------------------------------------- */

function PinAction({
  app,
  pinnedApps
}: {
  app: InstalledApp
  pinnedApps: PinnedApp[]
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const queryClient = useQueryClient()
  const pinMutation = usePinApp()
  const unpinMutation = useMutation({
    mutationFn: unpinApp,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pinnedApps.byCylo(app.cylo_id)
      })
    }
  })

  const isPinned = pinnedApps.some((p) => p.app_instance_id === app.id)
  const isPending = pinMutation.isPending || unpinMutation.isPending

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation()
            if (isPinned) {
              unpinMutation.mutate(app.id)
            } else {
              pinMutation.mutate({
                app_instance_id: app.id,
                cylo_id: app.cylo_id
              })
            }
          }}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Star
              className={cn(
                "size-3.5",
                isPinned
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isPinned ? t("unpinApp") : t("pinApp")}</TooltipContent>
    </Tooltip>
  )
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

function useColumns(pinnedApps: PinnedApp[]): ColumnDef<InstalledApp>[] {
  const t = useTranslations("appboxmanager.installedApps")

  return useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all rows"
            className="size-4 accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) {
                el.indeterminate =
                  table.getIsSomePageRowsSelected() &&
                  !table.getIsAllPageRowsSelected()
              }
            }}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.display_name}`}
            className="size-4 accent-primary"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        id: "pin",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <TooltipProvider delayDuration={300}>
            <PinAction app={row.original} pinnedApps={pinnedApps} />
          </TooltipProvider>
        )
      },
      {
        accessorKey: "display_name",
        header: t("name"),
        cell: ({ row }) => (
          <ImageCell
            src={
              row.original.icon_image
                ? `${ICON_BASE_URL}${row.original.icon_image}`
                : ""
            }
            alt={row.original.display_name}
            text={row.original.display_name}
          />
        )
      },
      {
        accessorKey: "domain",
        header: t("domain"),
        cell: ({ row }) => (
          <span data-anonymize-domain className="text-sm text-muted-foreground">
            {row.original.domain || "—"}
          </span>
        )
      },
      {
        accessorKey: "version",
        header: t("version"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.version}
          </span>
        )
      },
      {
        accessorKey: "app_slots",
        header: t("slots"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.app_slots}{" "}
            {row.original.app_slots === 1 ? t("slot") : t("slots")}
          </span>
        )
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => <StatusCell status={row.original.status} />,
        filterFn: "arrIncludesSome" as const
      },
      {
        accessorKey: "cylo_name",
        header: t("cylo"),
        cell: ({ row }) => (
          <span data-anonymize-single className="text-sm">
            {row.original.cylo_name}
          </span>
        ),
        filterFn: "arrIncludesSome" as const
      },
      {
        accessorKey: "install_date",
        header: t("installedDate"),
        cell: ({ row }) => <DateCell date={row.original.install_date} />
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => <RowActions app={row.original} />
      }
    ],
    [t, pinnedApps]
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function InstalledAppsPage() {
  const t = useTranslations("appboxmanager.installedApps")
  const tDetail = useTranslations("appboxmanager.appDetail")
  const router = useRouter()
  const [bulkAction, setBulkAction] = useState<
    "start" | "stop" | "restart" | null
  >(null)
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()

  // Load all apps (limit=999 applied in the API function)
  const { data: apps, isLoading } = useInstalledApps()
  const { data: cylos } = useCylosSummary()
  const migratingCyloIds = useMemo(
    () => new Set((cylos ?? []).filter((c) => c.is_migrating).map((c) => c.id)),
    [cylos]
  )
  const appsWithEffectiveStatus = useMemo(
    () =>
      (apps ?? []).map((app) => ({
        ...app,
        status: migratingCyloIds.has(app.cylo_id) ? "migrating" : app.status
      })),
    [apps, migratingCyloIds]
  )

  // Fetch pinned apps for every unique cylo present in the installed apps list.
  const cyloIds = useMemo(
    () => [
      ...new Set(appsWithEffectiveStatus.map((a) => a.cylo_id).filter(Boolean))
    ],
    [appsWithEffectiveStatus]
  )
  const pinnedQueries = useQueries({
    queries: cyloIds.map((cyloId) => ({
      queryKey: queryKeys.pinnedApps.byCylo(cyloId),
      queryFn: () => getPinnedApps(cyloId)
    }))
  })
  // Flat list of all pinned apps across every cylo — recomputed when any query settles.
  const allPinnedApps = pinnedQueries.flatMap((q) => q.data ?? [])

  const columns = useColumns(allPinnedApps)

  // Pinned apps float to the top in sort_order order; rest follow unchanged.
  const sortedApps = useMemo(() => {
    if (!appsWithEffectiveStatus.length) return []
    if (!allPinnedApps.length) return appsWithEffectiveStatus
    const pinnedMap = new Map(
      allPinnedApps.map((p) => [p.app_instance_id, p.sort_order])
    )
    return [...appsWithEffectiveStatus].sort((a, b) => {
      const aOrder = pinnedMap.get(a.id)
      const bOrder = pinnedMap.get(b.id)
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
      if (aOrder !== undefined) return -1
      if (bOrder !== undefined) return 1
      return 0
    })
  }, [appsWithEffectiveStatus, allPinnedApps])

  const facetedFilters = useMemo<FacetedFilterConfig[]>(() => {
    const filters: FacetedFilterConfig[] = [
      {
        columnId: "status",
        title: t("filterByStatus"),
        options: STATUS_OPTIONS
      }
    ]

    if (cylos && cylos.length > 1) {
      filters.push({
        columnId: "cylo_name",
        title: t("filterByCylo"),
        options: cylos.map((c) => ({ value: c.name, label: c.name }))
      })
    }

    return filters
  }, [t, cylos])

  const handleRowClick = (
    row: InstalledApp,
    event?: React.MouseEvent<HTMLTableRowElement>
  ) => {
    const href = ROUTES.INSTALLED_APP_DETAIL(row.id)
    if (event?.metaKey || event?.ctrlKey || event?.button === 1) {
      window.open(href, "_blank", "noopener,noreferrer")
      return
    }
    router.push(href)
  }

  const runBulkAction = async (
    action: "start" | "stop" | "restart",
    selectedRows: InstalledApp[],
    clearSelection: () => void
  ) => {
    const eligibleIds = selectedRows
      .filter((app) => isEligibleForBulkAction(app, action))
      .map((app) => app.id)

    if (!eligibleIds.length) return

    const mutate =
      action === "start"
        ? startMutation.mutateAsync
        : action === "stop"
          ? stopMutation.mutateAsync
          : restartMutation.mutateAsync

    setBulkAction(action)
    try {
      await Promise.all(eligibleIds.map((id) => mutate(id)))
      clearSelection()
    } finally {
      setBulkAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <DataTable
        columns={columns}
        data={sortedApps}
        globalSearch
        searchPlaceholder={t("searchPlaceholder")}
        facetedFilters={facetedFilters}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage={t("empty")}
        enableRowSelection
        getRowId={(row) => String(row.id)}
        renderBulkActions={({ selectedRows, clearSelection }) =>
          selectedRows.length ? (
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const startEligible = selectedRows.some((app) =>
                  isEligibleForBulkAction(app, "start")
                )
                const stopEligible = selectedRows.some((app) =>
                  isEligibleForBulkAction(app, "stop")
                )
                const restartEligible = selectedRows.some((app) =>
                  isEligibleForBulkAction(app, "restart")
                )
                const ineligibleCount = selectedRows.filter(
                  (app) =>
                    !isEligibleForBulkAction(app, "start") &&
                    !isEligibleForBulkAction(app, "stop") &&
                    !isEligibleForBulkAction(app, "restart")
                ).length

                return (
                  <>
              <span className="text-xs text-muted-foreground">
                {t("bulkSelected", { count: selectedRows.length })}
              </span>
                    {ineligibleCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t("bulkUnavailable", { count: ineligibleCount })}
                      </span>
                    )}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={bulkAction !== null || !startEligible}
                onClick={() =>
                  runBulkAction("start", selectedRows, clearSelection)
                }
              >
                {bulkAction === "start" ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Play className="mr-1.5 size-3.5" />
                )}
                {tDetail("start")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={bulkAction !== null || !stopEligible}
                onClick={() =>
                  runBulkAction("stop", selectedRows, clearSelection)
                }
              >
                {bulkAction === "stop" ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Square className="mr-1.5 size-3.5" />
                )}
                {tDetail("stop")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={bulkAction !== null || !restartEligible}
                onClick={() =>
                  runBulkAction("restart", selectedRows, clearSelection)
                }
              >
                {bulkAction === "restart" ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1.5 size-3.5" />
                )}
                {tDetail("restart")}
              </Button>
                  </>
                )
              })()}
            </div>
          ) : null
        }
      />

      <InstalledAppDevPanel apps={appsWithEffectiveStatus} />
    </div>
  )
}
