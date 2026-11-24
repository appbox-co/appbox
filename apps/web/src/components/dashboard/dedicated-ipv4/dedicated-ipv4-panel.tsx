"use client"

import { useId, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { isNextLaunchWeekEnabled } from "@/config/launch-week-flags"
import { ROUTES } from "@/constants/routes"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

/** WHMCS lists the addons a customer can order, per service, here. */
const ORDER_URL = "https://billing.appbox.co/cart.php?gid=addons"

const DOCS_URL = "/docs/platform/dedicated-ipv4"

/** Appboxes the API refuses to assign to. */
const UNAVAILABLE_STATUSES = new Set(["suspended", "migrating"])

interface PendingAction {
  kind: "assign" | "primary" | "unassign"
  address: DedicatedIpv4Address
  /** Taken when the dialog opens, so the text holds while it closes. */
  appbox: string
  currentPrimary?: string
}

/** The API answers 403 while dedicated IPv4 is closed for this account. */
function isClosed(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

/** The API's own message for a refusal (4xx), else undefined. */
function refusalMessage(error: unknown) {
  if (!(error instanceof ApiError)) return undefined
  if (error.status < 400 || error.status >= 500) return undefined
  return error.message || undefined
}

export function DedicatedIpv4BuyButton() {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const { error } = useMyDedicatedIpv4()
  // Billing won't allocate an address while the feature is closed.
  if (isClosed(error)) return null
  return (
    <Button size="sm" className="w-full sm:w-auto" asChild>
      <a href={ORDER_URL} target="_blank" rel="noreferrer">
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
  // The guide is only built once day 4 is on, even for admins.
  const guideLive = isNextLaunchWeekEnabled("day_4")
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
        {guideLive && (
          <Link
            href={DOCS_URL}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <BookOpen className="size-3.5" />
            {t("readGuide")}
          </Link>
        )}
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
        navigator.clipboard
          .writeText(address)
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => toast.error(t("actionFailed")))
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
  appboxName,
  hasSiblings,
  showAppbox,
  busy,
  onAction
}: {
  address: DedicatedIpv4Address
  appboxName: string
  /** Other addresses are assigned to the same Appbox. */
  hasSiblings: boolean
  showAppbox: boolean
  busy: boolean
  onAction: (
    kind: PendingAction["kind"],
    address: DedicatedIpv4Address
  ) => void
}) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const detailId = useId()
  const lockedId = useId()
  const assigned = address.cylo_id !== null
  const role = address.is_primary ? t("roleInOut") : t("roleIn")
  // The API refuses to unassign a primary while others share its Appbox.
  const primaryLocked = assigned && address.is_primary && hasSiblings

  const status = assigned
    ? {
        label: t("statusActive"),
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      }
    : address.removal_pending
      ? {
          label: t("statusRemoving"),
          className:
            "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        }
      : { label: t("statusUnassigned"), className: "" }

  let detail: React.ReactNode
  if (!assigned) {
    detail = address.removal_pending
      ? t("removingHint")
      : t("unassignedHint")
  } else if (showAppbox) {
    detail = (
      <>
        {t.rich("assignedTo", {
          name: appboxName,
          appbox: (chunks) => (
            <Link
              href={ROUTES.APPBOX_DETAIL(address.cylo_id!)}
              className="font-medium text-foreground hover:underline"
            >
              <span data-anonymize-single>{chunks}</span>
            </Link>
          )
        })}
        {" · "}
        {role}
      </>
    )
  } else {
    detail = role
  }

  return (
    <li
      role="group"
      aria-label={address.address}
      className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
    >
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
          <div id={detailId} className="text-xs text-muted-foreground">
            {detail}
          </div>
          {primaryLocked && (
            <div id={lockedId} className="text-xs text-muted-foreground">
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
                onClick={() => onAction("primary", address)}
              >
                <Star className="mr-1.5 size-3.5" />
                {t("makePrimary")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy || primaryLocked}
              aria-describedby={primaryLocked ? lockedId : undefined}
              onClick={() => onAction("unassign", address)}
            >
              <Unlink className="mr-1.5 size-3.5" />
              {t("unassign")}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            disabled={busy || address.removal_pending}
            aria-describedby={detailId}
            onClick={() => onAction("assign", address)}
          >
            <ArrowRightLeft className="mr-1.5 size-3.5" />
            {t("assign")}
          </Button>
        )}
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Panel                                                                      */
/* -------------------------------------------------------------------------- */

export function DedicatedIpv4Panel({
  cyloId
}: {
  /** Show only this Appbox's addresses, plus unassigned ones to add to it. */
  cyloId?: number
}) {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const selectId = useId()
  const { data: addresses, isLoading, error } = useMyDedicatedIpv4()
  const { data: cylos } = useCylosSummary()

  const assignMutation = useAssignDedicatedIpv4()
  const primaryMutation = useMakeDedicatedIpv4Primary()
  const unassignMutation = useUnassignDedicatedIpv4()
  const busy =
    assignMutation.isPending ||
    primaryMutation.isPending ||
    unassignMutation.isPending

  // The action outlives `open`, so the dialog keeps its text while it closes.
  const [action, setAction] = useState<PendingAction | null>(null)
  const [open, setOpen] = useState(false)
  const [targetCyloId, setTargetCyloId] = useState("")
  const [makePrimary, setMakePrimary] = useState(false)

  const cylosById = useMemo(
    () => new Map((cylos ?? []).map((c) => [c.id, c])),
    [cylos]
  )
  const appboxName = (id: number) => cylosById.get(id)?.name ?? `#${id}`

  const all = useMemo(() => addresses ?? [], [addresses])
  const countOn = (id: number | null) =>
    id === null ? 0 : all.filter((a) => a.cylo_id === id).length

  // Assigned addresses first, grouped by Appbox with the primary on top,
  // then the free ones. On an Appbox's page, only its own and the free ones.
  const shown = useMemo(() => {
    const list = cyloId
      ? all.filter((a) => a.cylo_id === cyloId || a.cylo_id === null)
      : all
    const group = (x: DedicatedIpv4Address) =>
      x.cylo_id === null ? Number.MAX_SAFE_INTEGER : x.cylo_id
    return [...list].sort(
      (a, b) =>
        group(a) - group(b) ||
        Number(b.is_primary) - Number(a.is_primary) ||
        a.id - b.id
    )
  }, [all, cyloId])

  const target = targetCyloId ? Number(targetCyloId) : null
  const targetUnavailable =
    target !== null &&
    UNAVAILABLE_STATUSES.has(cylosById.get(target)?.status ?? "")

  const openAction = (
    kind: PendingAction["kind"],
    address: DedicatedIpv4Address
  ) => {
    setAction({
      kind,
      address,
      appbox: address.cylo_id !== null ? appboxName(address.cylo_id) : "",
      currentPrimary: all.find(
        (a) => a.cylo_id === address.cylo_id && a.is_primary
      )?.address
    })
    setMakePrimary(false)
    setTargetCyloId(cyloId ? String(cyloId) : "")
    setOpen(true)
  }

  const closeDialog = () => {
    if (!busy) setOpen(false)
  }

  const onDone = (message: string) => (result: DedicatedIpv4Change) => {
    toast.success(
      message,
      result?.applied === false ? { description: t("appliedLater") } : {}
    )
    setOpen(false)
  }

  const onError = (err: unknown) => {
    toast.error(refusalMessage(err) ?? t("actionFailed"))
  }

  const confirm = () => {
    if (!action) return
    const { id, address } = action.address
    if (action.kind === "assign") {
      if (target === null || targetUnavailable) return
      assignMutation.mutate(
        { id, cyloId: target, primary: makePrimary },
        {
          onSuccess: onDone(
            t("assigned", { address, appbox: appboxName(target) })
          ),
          onError
        }
      )
    } else if (action.kind === "primary") {
      primaryMutation.mutate(id, {
        onSuccess: onDone(t("primaryChanged", { address })),
        onError
      })
    } else {
      unassignMutation.mutate(id, {
        onSuccess: onDone(t("unassigned", { address })),
        onError
      })
    }
  }

  /* ---- Closed, failed or loading ---- */

  if (!addresses && isClosed(error)) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        {t("notAvailable")}
      </div>
    )
  }

  const dialogText = action && {
    assign: {
      title: t("assignTitle", { address: action.address.address }),
      description: t("assignDescription"),
      confirm: t("assign")
    },
    primary: {
      title: t("primaryTitle"),
      description: t("primaryDescription", {
        appbox: action.appbox,
        address: action.address.address,
        current: action.currentPrimary ?? ""
      }),
      confirm: t("makePrimary")
    },
    unassign: {
      title: t("unassignTitle", { address: action.address.address }),
      description: t("unassignDescription", {
        appbox: action.appbox,
        address: action.address.address
      }),
      confirm: t("unassign")
    }
  }[action.kind]

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

      {!addresses && error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {t("loadFailed")}
        </div>
      )}

      {addresses && shown.length === 0 && (
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
        </div>
      )}

      {shown.length > 0 && (
        <ul className="space-y-2">
          {shown.map((address) => (
            <AddressRow
              key={address.id}
              address={address}
              appboxName={
                address.cylo_id !== null ? appboxName(address.cylo_id) : ""
              }
              hasSiblings={countOn(address.cylo_id) > 1}
              showAppbox={!cyloId}
              busy={busy}
              onAction={openAction}
            />
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
        {action && dialogText && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogText.title}</DialogTitle>
              <DialogDescription>{dialogText.description}</DialogDescription>
            </DialogHeader>

            {action.kind === "assign" && (
              <>
                <div className="space-y-1.5">
                  {!cyloId && (
                    <>
                      <Label htmlFor={selectId}>{t("appbox")}</Label>
                      <Select
                        value={targetCyloId}
                        onValueChange={setTargetCyloId}
                      >
                        <SelectTrigger id={selectId}>
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
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("amsterdamOnly")}
                  </p>
                </div>

                {target !== null &&
                  !targetUnavailable &&
                  (countOn(target) > 0 ? (
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
              </>
            )}

            {action.kind === "unassign" && action.address.is_primary && (
              <p className="text-sm text-muted-foreground">
                {t("unassignPrimaryNote")}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={busy}>
                {t("cancel")}
              </Button>
              <Button
                variant={action.kind === "unassign" ? "destructive" : "default"}
                onClick={confirm}
                disabled={
                  busy ||
                  (action.kind === "assign" &&
                    (target === null || targetUnavailable))
                }
              >
                {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {dialogText.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
