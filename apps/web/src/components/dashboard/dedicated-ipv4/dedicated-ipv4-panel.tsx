"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Network,
  ShoppingCart,
  Star,
  Unlink
} from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/api/client"
import type { CyloSummary } from "@/api/cylos/cylos"
import { useCylosSummary } from "@/api/cylos/hooks/use-cylos"
import {
  useAssignDedicatedIpv4,
  useMakeDedicatedIpv4Primary,
  useMyDedicatedIpv4,
  useUnassignDedicatedIpv4,
  type DedicatedIpv4Address,
  type DedicatedIpv4Change
} from "@/api/dedicated-ipv4/hooks/use-dedicated-ipv4"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

/** WHMCS lists the addons a customer can order, per service, here. */
export const DEDICATED_IPV4_ORDER_URL =
  "https://billing.appbox.co/cart.php?gid=addons"

export const DEDICATED_IPV4_DOCS_URL = "/docs/platform/dedicated-ipv4"

/** Appboxes the API refuses to assign to. */
const UNAVAILABLE_STATUSES = new Set(["suspended", "migrating"])

type PendingAction =
  | { kind: "assign"; address: DedicatedIpv4Address }
  | { kind: "primary"; address: DedicatedIpv4Address }
  | { kind: "unassign"; address: DedicatedIpv4Address }

interface DedicatedIpv4PanelProps {
  /** Show only this Appbox's addresses, plus unassigned ones to add to it. */
  cyloId?: number
}

export function DedicatedIpv4BuyButton({ className }: { className?: string }) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  return (
    <Button size="sm" className={cn("w-full sm:w-auto", className)} asChild>
      <a href={DEDICATED_IPV4_ORDER_URL} target="_blank" rel="noreferrer">
        <ShoppingCart className="mr-1.5 size-4" />
        {t("buy")}
        <ExternalLink className="ml-1.5 size-3 opacity-70" />
      </a>
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                               */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const points = [
    t("howInbound"),
    t("howOutbound"),
    t("howHost"),
    t("howTiming")
  ]
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("howTitle")}</h2>
        <Link
          href={DEDICATED_IPV4_DOCS_URL}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <BookOpen className="size-3.5" />
          {t("readGuide")}
        </Link>
      </div>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("howLimits")}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  One address                                                                */
/* -------------------------------------------------------------------------- */

function CopyAddress({ address }: { address: string }) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(address).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={t("copy", { address })}
      title={t("copy", { address })}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function AddressRow({
  address,
  appbox,
  hasSiblings,
  showAppbox,
  busy,
  onAction
}: {
  address: DedicatedIpv4Address
  appbox: CyloSummary | undefined
  /** Other addresses are assigned to the same Appbox. */
  hasSiblings: boolean
  showAppbox: boolean
  busy: boolean
  onAction: (action: PendingAction) => void
}) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const assigned = address.cylo_id !== null

  let status: { label: string; className: string }
  if (assigned) {
    status = {
      label: t("statusActive"),
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    }
  } else if (address.removal_pending) {
    status = {
      label: t("statusRemoving"),
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    }
  } else {
    status = { label: t("statusUnassigned"), className: "" }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Network className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-medium">
              {address.address}
            </span>
            <CopyAddress address={address.address} />
            <Badge
              variant="outline"
              className={cn("text-xs", status.className)}
            >
              {status.label}
            </Badge>
            {address.is_primary && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Star className="size-3" />
                {t("primary")}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {assigned ? (
              showAppbox ? (
                <>
                  {t("assignedTo")}{" "}
                  <Link
                    href={ROUTES.APPBOX_DETAIL(address.cylo_id!)}
                    className="font-medium text-foreground hover:underline"
                  >
                    <span data-anonymize-single>
                      {appbox?.name ?? `#${address.cylo_id}`}
                    </span>
                  </Link>
                  {" · "}
                  {address.is_primary ? t("roleInOut") : t("roleIn")}
                </>
              ) : address.is_primary ? (
                t("roleInOut")
              ) : (
                t("roleIn")
              )
            ) : address.removal_pending ? (
              t("removingHint")
            ) : (
              t("unassignedHint")
            )}
          </div>
          {assigned && address.is_primary && hasSiblings && (
            <div className="text-xs text-muted-foreground">
              {t("primaryLastHint")}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {assigned ? (
          <>
            {!address.is_primary && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onAction({ kind: "primary", address })}
              >
                <Star className="mr-1.5 size-3.5" />
                {t("makePrimary")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy || (address.is_primary && hasSiblings)}
              onClick={() => onAction({ kind: "unassign", address })}
            >
              <Unlink className="mr-1.5 size-3.5" />
              {t("unassign")}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            disabled={busy || address.removal_pending}
            onClick={() => onAction({ kind: "assign", address })}
          >
            <ArrowRightLeft className="mr-1.5 size-3.5" />
            {t("assign")}
          </Button>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Panel                                                                      */
/* -------------------------------------------------------------------------- */

export function DedicatedIpv4Panel({ cyloId }: DedicatedIpv4PanelProps) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const { data: addresses, isLoading, error } = useMyDedicatedIpv4()
  const { data: cylos } = useCylosSummary()

  const assignMutation = useAssignDedicatedIpv4()
  const primaryMutation = useMakeDedicatedIpv4Primary()
  const unassignMutation = useUnassignDedicatedIpv4()
  const busy =
    assignMutation.isPending ||
    primaryMutation.isPending ||
    unassignMutation.isPending

  const [pending, setPending] = useState<PendingAction | null>(null)
  const [targetCyloId, setTargetCyloId] = useState<string>("")
  const [makePrimary, setMakePrimary] = useState(false)

  const cylosById = useMemo(
    () => new Map((cylos ?? []).map((c) => [c.id, c])),
    [cylos]
  )

  const all = useMemo(() => addresses ?? [], [addresses])
  const countOn = (id: number | null) =>
    id === null ? 0 : all.filter((a) => a.cylo_id === id).length

  // On an Appbox's page: its own addresses first, then the free ones.
  const shown = useMemo(() => {
    const list = cyloId
      ? all.filter((a) => a.cylo_id === cyloId || a.cylo_id === null)
      : all
    return [...list].sort((a, b) => {
      const rank = (x: DedicatedIpv4Address) =>
        x.cylo_id === null ? 2 : x.is_primary ? 0 : 1
      return (
        (a.cylo_id ?? 0) - (b.cylo_id ?? 0) || rank(a) - rank(b) || a.id - b.id
      )
    })
  }, [all, cyloId])

  const openAction = (action: PendingAction) => {
    setPending(action)
    setMakePrimary(false)
    setTargetCyloId(cyloId ? String(cyloId) : "")
  }

  const closeDialog = () => {
    if (!busy) setPending(null)
  }

  const announce = (result: DedicatedIpv4Change, message: string) => {
    if (result?.applied === false) {
      toast.success(message, { description: t("appliedLater") })
    } else {
      toast.success(message)
    }
    setPending(null)
  }

  const fail = (err: unknown) => {
    toast.error(err instanceof Error ? err.message : t("actionFailed"))
  }

  const confirm = () => {
    if (!pending) return
    const { address } = pending
    if (pending.kind === "assign") {
      const target = Number(targetCyloId)
      if (!target) return
      const name = cylosById.get(target)?.name ?? `#${target}`
      assignMutation.mutate(
        { id: address.id, cyloId: target, primary: makePrimary },
        {
          onSuccess: (r) =>
            announce(
              r,
              t("assigned", { address: address.address, appbox: name })
            ),
          onError: fail
        }
      )
    } else if (pending.kind === "primary") {
      primaryMutation.mutate(address.id, {
        onSuccess: (r) =>
          announce(r, t("primaryChanged", { address: address.address })),
        onError: fail
      })
    } else {
      unassignMutation.mutate(address.id, {
        onSuccess: (r) =>
          announce(r, t("unassigned", { address: address.address })),
        onError: fail
      })
    }
  }

  /* ---- Closed, failed or loading ---- */

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        {t("notAvailable")}
      </div>
    )
  }

  const pendingAppbox =
    pending && pending.address.cylo_id !== null
      ? (cylosById.get(pending.address.cylo_id)?.name ??
        `#${pending.address.cylo_id}`)
      : ""
  const currentPrimary =
    pending?.kind === "primary"
      ? all.find((a) => a.cylo_id === pending.address.cylo_id && a.is_primary)
      : undefined
  const target = targetCyloId ? Number(targetCyloId) : null
  const targetHasAddresses = countOn(target) > 0

  return (
    <div className="space-y-4">
      <HowItWorks />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {t("loadFailed")}
        </div>
      )}

      {!isLoading && !error && shown.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
          <Network className="size-10 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {cyloId && all.length > 0 ? t("emptyHere") : t("empty")}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
          <DedicatedIpv4BuyButton />
        </div>
      )}

      {!isLoading && !error && shown.length > 0 && (
        <div className="space-y-2">
          {shown.map((address) => (
            <AddressRow
              key={address.id}
              address={address}
              appbox={
                address.cylo_id !== null
                  ? cylosById.get(address.cylo_id)
                  : undefined
              }
              hasSiblings={countOn(address.cylo_id) > 1}
              showAppbox={!cyloId}
              busy={busy}
              onAction={openAction}
            />
          ))}
        </div>
      )}

      {/* ---- Assign ---- */}
      <Dialog
        open={pending?.kind === "assign"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("assignTitle", { address: pending?.address.address ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("assignDescription")}</DialogDescription>
          </DialogHeader>

          {!cyloId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="dipv4-appbox">
                {t("appbox")}
              </label>
              <Select value={targetCyloId} onValueChange={setTargetCyloId}>
                <SelectTrigger id="dipv4-appbox">
                  <SelectValue placeholder={t("chooseAppbox")} />
                </SelectTrigger>
                <SelectContent>
                  {(cylos ?? []).map((c) => (
                    <SelectItem
                      key={c.id}
                      value={String(c.id)}
                      disabled={UNAVAILABLE_STATUSES.has(c.status)}
                    >
                      <span data-anonymize-single>{c.name}</span>
                      {UNAVAILABLE_STATUSES.has(c.status) && (
                        <span className="ml-1 text-muted-foreground">
                          ({t("appboxUnavailable")})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("amsterdamOnly")}
              </p>
            </div>
          )}

          {target !== null &&
            (targetHasAddresses ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={makePrimary}
                  onChange={(e) => setMakePrimary(e.target.checked)}
                />
                <span>
                  {t("assignMakePrimary")}
                  <span className="block text-xs text-muted-foreground">
                    {t("assignMakePrimaryHint")}
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("assignFirstIsPrimary")}
              </p>
            ))}

          {cyloId && (
            <p className="text-xs text-muted-foreground">
              {t("amsterdamOnly")}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={confirm} disabled={busy || target === null}>
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {t("assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Make primary ---- */}
      <Dialog
        open={pending?.kind === "primary"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("primaryTitle")}</DialogTitle>
            <DialogDescription>
              {currentPrimary
                ? t("primaryDescription", {
                    appbox: pendingAppbox,
                    address: pending?.address.address ?? "",
                    current: currentPrimary.address
                  })
                : t("primaryDescriptionNoCurrent", {
                    appbox: pendingAppbox,
                    address: pending?.address.address ?? ""
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {t("makePrimary")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Unassign ---- */}
      <Dialog
        open={pending?.kind === "unassign"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("unassignTitle", { address: pending?.address.address ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {t("unassignDescription", {
                appbox: pendingAppbox,
                address: pending?.address.address ?? ""
              })}
            </DialogDescription>
          </DialogHeader>
          {pending?.kind === "unassign" && pending.address.is_primary && (
            <p className="text-sm text-muted-foreground">
              {t("unassignPrimaryNote")}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {t("unassign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
