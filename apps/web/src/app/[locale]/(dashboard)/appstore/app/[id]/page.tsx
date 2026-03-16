"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  HelpCircle,
  Loader2,
  Package,
  Play,
  RotateCcw,
  Snowflake,
  Square
} from "lucide-react"
import type { AppVersion } from "@/api/apps/app-store"
import {
  getEffectiveAppSlots,
  getAppRestrictions,
  getPackages,
  isAppRestrictedForPackage
} from "@/api/apps/app-store"
import {
  useAppDetail,
  useAppVersions,
  useVoteApp
} from "@/api/apps/hooks/use-app-store"
import {
  useInstalledApps,
  useFreezeApp,
  useRestartApp,
  useStartApp,
  useStopApp,
  useUnfreezeApp,
  type InstalledApp
} from "@/api/installed-apps/hooks/use-installed-apps"
import { Comments } from "@/components/dashboard/comments"
import { DataTable } from "@/components/dashboard/data-table/data-table"
import {
  DateCell,
  ImageCell,
  StatusCell
} from "@/components/dashboard/data-table/data-table-cells"
import { HistoryBackButton } from "@/components/dashboard/navigation/history-back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarkdownDescription } from "@/components/ui/markdown-description"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/constants/routes"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { AppDevPanel } from "../../_components/app-dev-panel"
import { AppRating } from "../../_components/app-rating"
import { InstallDialog } from "../../_components/install-dialog"

const ICON_BASE_URL = "https://api.appbox.co/assets/images/apps/icons/"
const BILLING_BASE_URL = "https://billing.appbox.co"

/* -------------------------------------------------------------------------- */
/*  Version columns                                                            */
/* -------------------------------------------------------------------------- */

function useVersionColumns(appSlotsFallback: number): ColumnDef<AppVersion>[] {
  const t = useTranslations("appstore")

  return [
    {
      accessorKey: "version",
      header: t("app.version"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.version}</span>
      )
    },
    {
      accessorKey: "app_slots",
      header: t("app.appSlots"),
      cell: ({ row }) => {
        const appSlots = Number(row.original.app_slots ?? 0)
        return appSlots > 0 ? appSlots : appSlotsFallback
      }
    },
    {
      accessorKey: "memory",
      header: t("app.baseMemory"),
      cell: ({ row }) => {
        const memory = Number(row.original.memory ?? 0)
        if (!Number.isFinite(memory)) return "—"
        return memory === 0 ? "∞" : `${memory} GB`
      }
    },
    {
      accessorKey: "cpus",
      header: t("app.baseCpus"),
      cell: ({ row }) => {
        const cpus = Number(row.original.cpus ?? 0)
        if (!Number.isFinite(cpus)) return "—"
        return cpus === 0 ? "∞" : cpus
      }
    },
    {
      accessorKey: "created_at",
      header: t("app.added"),
      cell: ({ row }) => formatDate(row.original.created_at)
    },
    {
      accessorKey: "changes",
      header: t("app.changes"),
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {row.original.changes || "—"}
        </span>
      )
    }
  ]
}

function InstalledInstanceRowActions({ app }: { app: InstalledApp }) {
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()
  const freezeMutation = useFreezeApp()
  const unfreezeMutation = useUnfreezeApp()

  const isRunning = app.status === "online"
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isFrozen = app.status === "frozen"
  const isTransitioning =
    app.status === "restarting" ||
    app.status === "installing" ||
    app.status === "updating" ||
    app.status === "deleting"

  const handleAction = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={
          isRunning || isFrozen || isTransitioning || startMutation.isPending
        }
        onClick={(e) => handleAction(e, () => startMutation.mutate(app.id))}
      >
        {startMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Play className="size-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={
          isStopped || isFrozen || isTransitioning || stopMutation.isPending
        }
        onClick={(e) => handleAction(e, () => stopMutation.mutate(app.id))}
      >
        {stopMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Square className="size-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={isStopped || isFrozen || isTransitioning || restartMutation.isPending}
        onClick={(e) => handleAction(e, () => restartMutation.mutate(app.id))}
      >
        {restartMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RotateCcw className="size-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={
          isTransitioning || freezeMutation.isPending || unfreezeMutation.isPending
        }
        onClick={(e) =>
          handleAction(e, () =>
            isFrozen ? unfreezeMutation.mutate(app.id) : freezeMutation.mutate(app.id)
          )
        }
      >
        {freezeMutation.isPending || unfreezeMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isFrozen ? (
          <Play className="size-3.5" />
        ) : (
          <Snowflake className="size-3.5" />
        )}
      </Button>
    </div>
  )
}

function useInstalledInstanceColumns(): ColumnDef<InstalledApp>[] {
  const tInstalled = useTranslations("appboxmanager.installedApps")

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
        accessorKey: "display_name",
        header: tInstalled("name"),
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
        header: tInstalled("domain"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.domain || "—"}
          </span>
        )
      },
      {
        accessorKey: "version",
        header: tInstalled("version")
      },
      {
        accessorKey: "status",
        header: tInstalled("status"),
        cell: ({ row }) => <StatusCell status={row.original.status} />
      },
      {
        accessorKey: "cylo_name",
        header: tInstalled("cylo")
      },
      {
        accessorKey: "install_date",
        header: tInstalled("installedDate"),
        cell: ({ row }) => <DateCell date={row.original.install_date} />
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => <InstalledInstanceRowActions app={row.original} />
      }
    ],
    [tInstalled]
  )
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="space-y-4 lg:w-64">
          <div className="size-28 rounded-2xl bg-muted mx-auto" />
          <div className="h-10 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

interface AppDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function AppDetailPage({ params }: AppDetailPageProps) {
  const { id } = use(params)
  const appId = Number(id)
  const router = useRouter()
  const t = useTranslations("appstore")
  const tInstalled = useTranslations("appboxmanager.installedApps")
  const tDetail = useTranslations("appboxmanager.appDetail")
  const { cylos } = useAuth()
  const [installOpen, setInstallOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<
    "start" | "stop" | "restart" | "freeze" | "unfreeze" | null
  >(null)

  const { data: app, isLoading, error } = useAppDetail(appId)
  const { data: versions, isLoading: versionsLoading } = useAppVersions(appId)
  const { data: installedApps, isLoading: installedAppsLoading } =
    useInstalledApps()
  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()
  const freezeMutation = useFreezeApp()
  const unfreezeMutation = useUnfreezeApp()
  const voteMutation = useVoteApp(appId)

  const versionColumns = useVersionColumns(Number(app?.app_slots ?? 0))
  const installedInstanceColumns = useInstalledInstanceColumns()
  const [minimumRequiredPlan, setMinimumRequiredPlan] = useState<string | null>(
    null
  )
  const [showMinimumPlanHint, setShowMinimumPlanHint] = useState(false)
  const [restrictedPackageIds, setRestrictedPackageIds] = useState<Set<number>>(
    new Set()
  )
  const appCategoryIds = useMemo(
    () =>
      (app?.categories ?? [])
        .map((cat) =>
          typeof cat.key === "number" ? cat.key : parseInt(String(cat.key), 10)
        )
        .filter((id) => Number.isFinite(id)),
    [app?.categories]
  )

  useEffect(() => {
    if (!app) {
      setMinimumRequiredPlan(null)
      setShowMinimumPlanHint(false)
      setRestrictedPackageIds(new Set())
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const packages = await getPackages()
        const candidatePackages = packages
          .filter(
            (pkg) =>
              pkg.id > 0 &&
              pkg.display_name &&
              pkg.hidden !== 1 &&
              /^[A-Za-z]+-/.test(pkg.display_name)
          )
          .sort((a, b) => {
            const aOrder =
              typeof a.sort_order === "number"
                ? a.sort_order
                : Number.MAX_SAFE_INTEGER
            const bOrder =
              typeof b.sort_order === "number"
                ? b.sort_order
                : Number.MAX_SAFE_INTEGER
            return aOrder - bOrder
          })

        if (candidatePackages.length === 0) {
          if (!cancelled) {
            setMinimumRequiredPlan(null)
            setShowMinimumPlanHint(false)
            setRestrictedPackageIds(new Set())
          }
          return
        }

        const restrictionChecks = await Promise.allSettled(
          candidatePackages.map(async (pkg) => {
            const restrictions = await getAppRestrictions(pkg.id)
            return {
              id: pkg.id,
              restricted: isAppRestrictedForPackage(
                app.id,
                appCategoryIds,
                restrictions
              )
            }
          })
        )

        if (cancelled) return

        const resolved = restrictionChecks
          .filter(
            (result): result is PromiseFulfilledResult<{
              id: number
              restricted: boolean
            }> => result.status === "fulfilled"
          )
          .map((result) => result.value)

        if (resolved.length === 0) {
          setMinimumRequiredPlan(null)
          setShowMinimumPlanHint(false)
          setRestrictedPackageIds(new Set())
          return
        }

        const restrictedIds = new Set(
          resolved.filter((row) => row.restricted).map((row) => row.id)
        )
        const firstEligible = candidatePackages.find(
          (pkg) => !restrictedIds.has(pkg.id)
        )

        setMinimumRequiredPlan(firstEligible?.display_name ?? null)

        const userPackageIds = new Set(
          (cylos ?? [])
            .map((cylo) => Number(cylo.package_id))
            .filter((packageId) => Number.isFinite(packageId) && packageId > 0)
        )

        // Show the pre-install warning only if every user Appbox package
        // is restricted for this app (or user has no Appboxes yet).
        const shouldShowHint =
          userPackageIds.size === 0
            ? restrictedIds.size > 0
            : [...userPackageIds].every((packageId) =>
                restrictedIds.has(packageId)
              )

        setShowMinimumPlanHint(shouldShowHint)
        setRestrictedPackageIds(restrictedIds)
      } catch {
        if (!cancelled) {
          setMinimumRequiredPlan(null)
          setShowMinimumPlanHint(false)
          setRestrictedPackageIds(new Set())
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [app, appCategoryIds, cylos])

  const upgradeCtaUrl = useMemo(() => {
    const restrictedCylo = (cylos ?? []).find(
      (cylo) =>
        restrictedPackageIds.has(Number(cylo.package_id)) &&
        !!cylo.whmcs_serviceid
    )
    if (!restrictedCylo?.whmcs_serviceid) return null
    return `${BILLING_BASE_URL}/upgrade.php?type=package&id=${restrictedCylo.whmcs_serviceid}`
  }, [cylos, restrictedPackageIds])

  if (isLoading) return <DetailSkeleton />

  if (error || !app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="size-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">App not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The requested app could not be found.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={ROUTES.APP_STORE}>
            <ArrowLeft className="mr-2 size-4" />
            Back to App Store
          </Link>
        </Button>
      </div>
    )
  }

  const requiredSlots = getEffectiveAppSlots(app)
  const nestedVersions = app.versions ?? []
  const versionRows = nestedVersions.length > 0 ? nestedVersions : (versions ?? [])
  const showVersionsLoading = nestedVersions.length === 0 && versionsLoading
  const appInstances = (installedApps ?? []).filter(
    (instance) => instance.app_id === app.id
  )

  const handleInstalledRowClick = (
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
    action: "start" | "stop" | "restart" | "freeze" | "unfreeze",
    selectedRows: InstalledApp[],
    clearSelection: () => void
  ) => {
    const eligibleIds = selectedRows
      .filter((installedApp) => {
        const isStopped =
          installedApp.status === "offline" ||
          installedApp.status === "inactive"
        const isFrozen = installedApp.status === "frozen"
        const isTransitioning =
          installedApp.status === "restarting" ||
          installedApp.status === "installing" ||
          installedApp.status === "updating" ||
          installedApp.status === "deleting"

        if (action === "start") return !isTransitioning && !isFrozen && isStopped
        if (action === "stop")
          return !isTransitioning && !isFrozen && installedApp.status === "online"
        if (action === "restart") return !isTransitioning && !isFrozen && !isStopped
        if (action === "freeze") return !isTransitioning && !isFrozen
        return isFrozen
      })
      .map((installedApp) => installedApp.id)

    if (!eligibleIds.length) return

    const mutate =
      action === "start"
        ? startMutation.mutateAsync
        : action === "stop"
          ? stopMutation.mutateAsync
          : action === "restart"
            ? restartMutation.mutateAsync
            : action === "freeze"
              ? freezeMutation.mutateAsync
              : unfreezeMutation.mutateAsync

    setBulkAction(action)
    try {
      await Promise.all(eligibleIds.map((instanceId) => mutate(instanceId)))
      clearSelection()
    } finally {
      setBulkAction(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <HistoryBackButton
        fallbackHref={ROUTES.APP_STORE}
        fallbackLabel={t("title")}
        currentLabel={app.display_name}
      />

      {/* Main layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar - App info */}
        <div className="shrink-0 space-y-5 lg:w-56">
          {/* Icon */}
          <div className="relative mx-auto size-28 overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/50">
            {app.icon_image ? (
              <Image
                src={`${ICON_BASE_URL}${app.icon_image}`}
                alt={app.display_name}
                width={112}
                height={112}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Vote */}
          <div className="flex justify-center">
            <AppRating
              upvotes={app.upvotes}
              downvotes={app.downvotes}
              userVote={app.uservote}
              isPending={voteMutation.isPending}
              onVote={(dir) => voteMutation.mutate(dir)}
            />
          </div>

          {/* Get / Install button */}
          <Button
            className="w-full bg-linear-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-md hover:from-[#4f46e5] hover:to-[#4338ca] hover:shadow-lg"
            size="lg"
            disabled={app.enabled === 0}
            onClick={() => setInstallOpen(true)}
          >
            {app.enabled === 0 ? t("app.disabled") : t("app.getApp")}
          </Button>
          {showMinimumPlanHint && minimumRequiredPlan && (
            <div className="space-y-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-amber-400/80">
                  {t("app.minimumPlanLabel")}
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {minimumRequiredPlan}
                </span>
              </div>
              {upgradeCtaUrl && (
                <Button
                  size="sm"
                  className="h-8 w-full gap-1.5 border-amber-500/30 bg-amber-500/15 text-xs text-amber-300 hover:bg-amber-500/25"
                  variant="outline"
                  asChild
                >
                  <a href={upgradeCtaUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                    {t("install.guard.upgradePackage")}
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>{t("app.requiresSlots", { count: requiredSlots })}</span>
            </div>
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-1">
            {app.devsite && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs text-muted-foreground"
                asChild
              >
                <a href={app.devsite} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  {t("app.visitDeveloper")}
                </a>
              </Button>
            )}
            {app.helpsite && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs text-muted-foreground"
                asChild
              >
                <a
                  href={app.helpsite}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HelpCircle className="size-3.5" />
                  {t("app.helpSupport")}
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Right content */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* App name + description */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">{app.display_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("app.by")} {app.publisher}
                </p>
              </div>
            </div>

            {/* Categories */}
            {app.categories && app.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {app.categories.map((cat) => (
                  <Badge
                    key={cat.key}
                    variant="outline"
                    className="border-primary/30 text-primary"
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("app.description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownDescription content={app.description} />
            </CardContent>
          </Card>

          {/* Versions table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("app.versions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={versionColumns}
                data={versionRows}
                isLoading={showVersionsLoading}
                emptyMessage="No versions available."
                pageSize={5}
              />
            </CardContent>
          </Card>

          {/* Installed instances for current user */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("app.installed")} ({appInstances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={installedInstanceColumns}
                data={appInstances}
                isLoading={installedAppsLoading}
                emptyMessage={tInstalled("empty")}
                globalSearch
                searchPlaceholder={tInstalled("searchPlaceholder")}
                onRowClick={handleInstalledRowClick}
                enableRowSelection
                getRowId={(row) => String(row.id)}
                renderBulkActions={({ selectedRows, clearSelection }) =>
                  selectedRows.length ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {tInstalled("bulkSelected", {
                          count: selectedRows.length
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={
                          bulkAction !== null ||
                          !selectedRows.some((installedApp) => {
                            const isStopped =
                              installedApp.status === "offline" ||
                              installedApp.status === "inactive"
                            const isFrozen = installedApp.status === "frozen"
                            const isTransitioning =
                              installedApp.status === "restarting" ||
                              installedApp.status === "installing" ||
                              installedApp.status === "updating" ||
                              installedApp.status === "deleting"
                            return !isTransitioning && !isFrozen && isStopped
                          })
                        }
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
                        disabled={
                          bulkAction !== null ||
                          !selectedRows.some((installedApp) => {
                            const isFrozen = installedApp.status === "frozen"
                            const isTransitioning =
                              installedApp.status === "restarting" ||
                              installedApp.status === "installing" ||
                              installedApp.status === "updating" ||
                              installedApp.status === "deleting"
                            return (
                              !isTransitioning &&
                              !isFrozen &&
                              installedApp.status === "online"
                            )
                          })
                        }
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
                        disabled={
                          bulkAction !== null ||
                          !selectedRows.some((installedApp) => {
                            const isStopped =
                              installedApp.status === "offline" ||
                              installedApp.status === "inactive"
                            const isFrozen = installedApp.status === "frozen"
                            const isTransitioning =
                              installedApp.status === "restarting" ||
                              installedApp.status === "installing" ||
                              installedApp.status === "updating" ||
                              installedApp.status === "deleting"
                            return !isTransitioning && !isFrozen && !isStopped
                          })
                        }
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={
                          bulkAction !== null ||
                          !selectedRows.some((installedApp) => {
                            const isFrozen = installedApp.status === "frozen"
                            const isTransitioning =
                              installedApp.status === "restarting" ||
                              installedApp.status === "installing" ||
                              installedApp.status === "updating" ||
                              installedApp.status === "deleting"
                            return !isTransitioning && !isFrozen
                          })
                        }
                        onClick={() =>
                          runBulkAction("freeze", selectedRows, clearSelection)
                        }
                      >
                        {bulkAction === "freeze" ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Snowflake className="mr-1.5 size-3.5" />
                        )}
                        {tDetail("freeze")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={
                          bulkAction !== null ||
                          !selectedRows.some(
                            (installedApp) => installedApp.status === "frozen"
                          )
                        }
                        onClick={() =>
                          runBulkAction("unfreeze", selectedRows, clearSelection)
                        }
                      >
                        {bulkAction === "unfreeze" ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Play className="mr-1.5 size-3.5" />
                        )}
                        {tDetail("unfreeze")}
                      </Button>
                    </div>
                  ) : null
                }
                pageSize={5}
              />
            </CardContent>
          </Card>

          {/* Comments */}
          <Comments appId={app.id} />
        </div>
      </div>

      {/* Install dialog */}
      <InstallDialog
        app={app}
        open={installOpen}
        onOpenChange={setInstallOpen}
      />

      {/* Dev overlay for testing install guard states */}
      <AppDevPanel appId={appId} />
    </div>
  )
}
