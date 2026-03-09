"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpRight,
  Globe,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Trash2
} from "lucide-react"
import { checkSubdomainDns } from "@/api/apps/app-store"
import {
  useDeleteDomain,
  useDomains,
  type Domain
} from "@/api/domains/hooks/use-domains"
import { DataTable } from "@/components/dashboard/data-table/data-table"
import { DateCell } from "@/components/dashboard/data-table/data-table-cells"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { WS_EVENTS } from "@/constants/events"
import { queryKeys } from "@/constants/query-keys"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/providers/websocket-provider"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// Platform-managed domain suffixes — these are auto-assigned to every appbox
// and its installed apps. We hide them from the domains table because the user
// has no control over them (can't delete/verify/configure them here).
const PLATFORM_SUFFIXES = [
  "appboxes.co",
  "abx.bz",
  "cylo.net",
  "cylo.io",
  "appbox.co"
]

function isPlatformDomain(domain: Domain): boolean {
  const lower = domain.domain.toLowerCase()
  return PLATFORM_SUFFIXES.some((s) => lower === s || lower.endsWith(`.${s}`))
}

function isManaged(domain: Domain): boolean {
  return domain.type === "subdomain" && domain.parent !== null
}

function isCustomBase(domain: Domain): boolean {
  return domain.type === "domain"
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

function useColumns(
  allDomains: Domain[],
  onDelete: (domain: Domain) => void,
  onReverify: (domain: Domain) => void,
  reverifyingId: number | null
): ColumnDef<Domain>[] {
  const t = useTranslations("appboxmanager.domains")

  // Build set of parent IDs that have children (used to guard delete)
  const parentIds = useMemo(
    () => new Set(allDomains.map((d) => d.parent).filter(Boolean) as number[]),
    [allDomains]
  )

  return useMemo(
    () => [
      {
        accessorKey: "domain",
        header: t("domain"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium font-mono text-sm">
              {row.original.domain}
            </span>
          </div>
        )
      },
      {
        accessorKey: "type",
        header: t("type"),
        cell: ({ row }) => {
          const d = row.original
          if (isCustomBase(d)) {
            return (
              <Badge variant="outline" className="text-xs">
                {t("typeBase")}
              </Badge>
            )
          }
          if (isManaged(d)) {
            return (
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-700 border-blue-500/25 dark:text-blue-400"
              >
                {t("typeManaged")}
              </Badge>
            )
          }
          return (
            <Badge
              variant="outline"
              className="text-xs bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-400"
            >
              {t("typeCustom")}
            </Badge>
          )
        }
      },
      {
        accessorKey: "app",
        header: t("app"),
        cell: ({ row }) => {
          const d = row.original
          // Base domains are not assigned to a specific app instance
          if (isCustomBase(d) || !d.app) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          if (d.instance_id) {
            return (
              <Link
                href={ROUTES.INSTALLED_APP_DETAIL(d.instance_id)}
                className="inline-flex items-center gap-1 text-sm text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {d.app}
                <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
              </Link>
            )
          }
          return <span className="text-sm text-muted-foreground">{d.app}</span>
        }
      },
      {
        accessorKey: "ip_address",
        header: t("server"),
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.ip_address ?? "—"}
          </span>
        )
      },
      {
        accessorKey: "created_at",
        header: t("createdAt"),
        cell: ({ row }) => <DateCell date={row.original.created_at} />
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const d = row.original
          const hasChildren = parentIds.has(d.id)
          const canDelete = !hasChildren

          return (
            <div className="flex items-center gap-1 justify-end">
              {/* Re-verify DNS for custom subdomains (not managed, not base) */}
              {!isManaged(d) && !isCustomBase(d) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReverify(d)
                        }}
                        disabled={reverifyingId === d.id}
                      >
                        <RefreshCw
                          className={cn(
                            "size-3.5",
                            reverifyingId === d.id && "animate-spin"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("reverifyDns")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Delete: only for base domains with no children, or unmanaged subdomains */}
              {canDelete && (isCustomBase(d) || !isManaged(d)) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(d)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("deleteDomain")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {hasChildren && isCustomBase(d) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground cursor-not-allowed"
                        disabled
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("deleteBlockedHasChildren")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )
        }
      }
    ],
    [t, parentIds, onDelete, onReverify, reverifyingId]
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  const t = useTranslations("appboxmanager.domains")
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Globe className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{t("emptyTitle")}</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("emptyDescription")}
        </p>
      </div>
      <Button size="sm" onClick={() => router.push(ROUTES.APP_STORE)}>
        <ShoppingBag className="mr-1.5 size-4" />
        {t("goToAppStore")}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Re-verify Result Toast/Banner                                              */
/* -------------------------------------------------------------------------- */

interface ReverifyResult {
  domain: Domain
  verified: boolean
  expected_ip?: string
  resolved_ip?: string
}

function ReverifyBanner({
  result,
  onDismiss
}: {
  result: ReverifyResult
  onDismiss: () => void
}) {
  const t = useTranslations("appboxmanager.domains")

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 text-sm",
        result.verified
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      <div className="flex-1">
        <p className="font-medium">{result.domain.domain}</p>
        {result.verified ? (
          <p className="text-xs mt-0.5">{t("dnsVerified")}</p>
        ) : (
          <p className="text-xs mt-0.5">
            {t("dnsNotVerified")}
            {result.expected_ip && (
              <> — {t("expectedIp", { ip: result.expected_ip })}</>
            )}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-current opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DomainsPage() {
  const t = useTranslations("appboxmanager.domains")
  const queryClient = useQueryClient()
  const { on } = useWebSocket()
  const { data: domains, isLoading } = useDomains()
  const deleteMutation = useDeleteDomain()

  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null)
  const [reverifyingId, setReverifyingId] = useState<number | null>(null)
  const [reverifyResult, setReverifyResult] = useState<ReverifyResult | null>(
    null
  )

  const handleDelete = (domain: Domain) => setDeleteTarget(domain)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null)
    })
  }

  const handleReverify = async (domain: Domain) => {
    if (!domain.parent || !domain.fqdn) return
    setReverifyingId(domain.id)
    setReverifyResult(null)
    try {
      // fqdn is the subdomain part, parent is the base domain id
      // We need cylo_id -- use ip_address as proxy (serverapi checks by cylo)
      // The checkdns endpoint needs subdomain + domain_id + cylo_id.
      // Since we don't have cylo_id here, we pass the domain's parent id
      // and let the backend resolve the server.
      const result = await checkSubdomainDns(
        domain.fqdn,
        domain.parent,
        0 // cylo_id=0 means backend resolves from domain record's server_id
      )
      setReverifyResult({ domain, ...result })
    } catch {
      setReverifyResult({ domain, verified: false })
    } finally {
      setReverifyingId(null)
    }
  }

  const allDomains = (domains ?? []).filter((d) => !isPlatformDomain(d))
  const columns = useColumns(
    allDomains,
    handleDelete,
    handleReverify,
    reverifyingId
  )

  useEffect(() => {
    const unsub = on(WS_EVENTS.DOMAIN_CHANGED, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    })
    return () => unsub()
  }, [on, queryClient])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pageDescription")}
          </p>
        </div>
      </div>

      {reverifyResult && (
        <ReverifyBanner
          result={reverifyResult}
          onDismiss={() => setReverifyResult(null)}
        />
      )}

      {allDomains.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <DataTable
          columns={columns}
          data={allDomains}
          searchKey="domain"
          searchPlaceholder={t("searchPlaceholder")}
          isLoading={isLoading}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDomain")}</DialogTitle>
            <DialogDescription>
              {t("confirmDelete")}
              {deleteTarget && (
                <span className="block mt-1 font-mono text-sm font-medium text-foreground">
                  {deleteTarget.domain}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("deleteDomain")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
