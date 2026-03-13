"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Package, Play, RotateCcw, Square, Star } from "lucide-react"
import { useCylo } from "@/api/cylos/hooks/use-cylos"
import {
  useInstalledApps,
  useRestartApp,
  useStartApp,
  useStopApp,
  type InstalledApp
} from "@/api/installed-apps/hooks/use-installed-apps"
import {
  usePinApp,
  usePinnedApps,
  useUnpinApp
} from "@/api/pinned-apps/hooks/use-pinned-apps"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"

/* -------------------------------------------------------------------------- */
/*  Status filter options                                                      */
/* -------------------------------------------------------------------------- */

const STATUS_DOT_COLORS: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  inactive: "bg-zinc-500",
  restarting: "bg-sky-500",
  migrating: "bg-amber-500",
  installing: "bg-blue-500",
  updating: "bg-blue-500",
  deleting: "bg-red-500"
}

const STATUS_OPTIONS: FacetedFilterOption[] = [
  "online",
  "offline",
  "inactive",
  "restarting",
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

/* -------------------------------------------------------------------------- */
/*  Inline action buttons                                                      */
/* -------------------------------------------------------------------------- */

function RowActions({
  app,
  cyloRestarting
}: {
  app: InstalledApp
  cyloRestarting: boolean
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()

  const isRunning = app.status === "online"
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isTransitioning =
    cyloRestarting ||
    app.status === "restarting" ||
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
  cyloId,
  pinnedApps
}: {
  app: InstalledApp
  cyloId: number
  pinnedApps: PinnedApp[]
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const pinMutation = usePinApp()
  const unpinMutation = useUnpinApp(cyloId)
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
              pinMutation.mutate({ app_instance_id: app.id, cylo_id: cyloId })
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
/*  Columns (no Appbox column — already scoped to one appbox)                 */
/* -------------------------------------------------------------------------- */

function useColumns(
  cyloId: number,
  pinnedApps: PinnedApp[]
): ColumnDef<InstalledApp>[] {
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
            <PinAction
              app={row.original}
              cyloId={cyloId}
              pinnedApps={pinnedApps}
            />
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
          <span className="text-sm text-muted-foreground">
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
        accessorKey: "install_date",
        header: t("installedDate"),
        cell: ({ row }) => <DateCell date={row.original.install_date} />
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            app={row.original}
            cyloRestarting={row.original.status === "restarting"}
          />
        )
      }
    ],
    [t, cyloId, pinnedApps]
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface InstalledAppsQuickListProps {
  cyloId: number
  userId?: number
}

export function InstalledAppsQuickList({
  cyloId,
  userId
}: InstalledAppsQuickListProps) {
  const t = useTranslations("appboxmanager")
  const tInstalled = useTranslations("appboxmanager.installedApps")
  const tDetail = useTranslations("appboxmanager.appDetail")
  const router = useRouter()
  const [bulkAction, setBulkAction] = useState<
    "start" | "stop" | "restart" | null
  >(null)
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()
  const { data: apps, isLoading } = useInstalledApps(cyloId, userId)
  const { data: cylo } = useCylo(cyloId)
  const { data: pinnedApps } = usePinnedApps(cyloId)
  const appsWithEffectiveStatus = useMemo(
    () =>
      (apps ?? []).map((app) => ({
        ...app,
        status:
          cylo?.status === "restarting"
            ? "restarting"
            : cylo?.is_migrating
              ? "migrating"
              : app.status
      })),
    [apps, cylo?.is_migrating, cylo?.status]
  )
  const columns = useColumns(cyloId, pinnedApps ?? [])

  // Pinned apps float to the top in sort_order order; rest follow unchanged.
  const sortedApps = useMemo(() => {
    if (!appsWithEffectiveStatus.length) return []
    if (!pinnedApps?.length) return appsWithEffectiveStatus
    const pinnedMap = new Map(
      pinnedApps.map((p) => [p.app_instance_id, p.sort_order])
    )
    return [...appsWithEffectiveStatus].sort((a, b) => {
      const aOrder = pinnedMap.get(a.id)
      const bOrder = pinnedMap.get(b.id)
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
      if (aOrder !== undefined) return -1
      if (bOrder !== undefined) return 1
      return 0
    })
  }, [appsWithEffectiveStatus, pinnedApps])

  const facetedFilters = useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: t("installedApps.filterByStatus"),
        options: STATUS_OPTIONS
      }
    ],
    [t]
  )

  const runBulkAction = async (
    action: "start" | "stop" | "restart",
    selectedRows: InstalledApp[],
    clearSelection: () => void
  ) => {
    const eligibleIds = selectedRows
      .filter((app) => {
        const isStopped = app.status === "offline" || app.status === "inactive"
        const isTransitioning =
          app.status === "restarting" ||
          app.status === "migrating" ||
          app.status === "installing" ||
          app.status === "updating" ||
          app.status === "deleting"

        if (action === "start") return !isTransitioning && isStopped
        if (action === "stop")
          return !isTransitioning && app.status === "online"
        return !isTransitioning && !isStopped
      })
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="size-4 text-muted-foreground" />
          {t("cyloDetail.installedApps")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoading && (!apps || apps.length === 0) ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Package className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("cyloDetail.noApps")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sortedApps}
            globalSearch
            searchPlaceholder={t("installedApps.searchPlaceholder")}
            facetedFilters={facetedFilters}
            onRowClick={(row, event) => {
              const href = ROUTES.INSTALLED_APP_DETAIL(row.id)
              if (event?.metaKey || event?.ctrlKey || event?.button === 1) {
                window.open(href, "_blank", "noopener,noreferrer")
                return
              }
              router.push(href)
            }}
            isLoading={isLoading}
            emptyMessage={t("installedApps.empty")}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            enableRowSelection
            getRowId={(row) => String(row.id)}
            renderBulkActions={({ selectedRows, clearSelection }) =>
              selectedRows.length ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {tInstalled("bulkSelected", { count: selectedRows.length })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={bulkAction !== null}
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
                    disabled={bulkAction !== null}
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
                    disabled={bulkAction !== null}
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
                </div>
              ) : null
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
