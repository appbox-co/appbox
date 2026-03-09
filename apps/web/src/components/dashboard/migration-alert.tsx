"use client"

import type { ReactNode } from "react"
import { ArrowRightLeft, Clock, Loader2 } from "lucide-react"

function formatRelativeTime(iso: string): string {
  if (!iso) return ""
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60_000)
  const hrs = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return diff > 0 ? `in ${mins}m` : `${mins}m ago`
  if (hrs < 24) return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`
  return diff > 0 ? `in ${days}d` : `${days}d ago`
}

function shouldShowEta(iso?: string): boolean {
  if (!iso) return false
  const etaMs = Date.parse(iso)
  if (Number.isNaN(etaMs)) return false
  const diffMs = etaMs - Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  return diffMs >= 0 && diffMs <= thirtyDaysMs
}

interface MigrationAlertProps {
  title: string
  description: string
  phase?: ReactNode
  progress?: number
  from?: string
  to?: string
  eta?: string
  live?: boolean
  transferredText?: string
  reason?: string
  liveMessage: string
  offlineMessage: string
  fallbackMessage: string
  scene?: ReactNode
}

export function MigrationAlert({
  title,
  description,
  phase,
  progress,
  from,
  to,
  eta,
  live,
  transferredText,
  reason,
  liveMessage,
  offlineMessage,
  fallbackMessage,
  scene
}: MigrationAlertProps) {
  const hasProgress =
    typeof progress === "number" &&
    typeof live === "boolean" &&
    !!from &&
    !!to &&
    !!phase
  const pct = Math.max(0, Math.min(100, Math.round(progress ?? 0)))
  const phaseIsDuplicateDescription =
    typeof phase === "string" &&
    phase.trim().toLowerCase() === description.trim().toLowerCase()
  const bodyTextClass = scene
    ? "text-slate-900 dark:text-slate-100/90"
    : "text-muted-foreground"
  const mutedTextClass = scene
    ? "text-slate-800 dark:text-slate-200/85"
    : "text-muted-foreground"
  const hostChipClass = scene
    ? "rounded bg-white/85 px-2 py-0.5 font-mono text-[11px] text-slate-900 shadow-sm dark:bg-slate-900/70 dark:text-slate-100"
    : "rounded bg-muted px-2 py-0.5 font-mono text-[11px]"
  const contentShellClass = scene ? "rounded-lg p-3" : ""
  const progressPanelClass = scene
    ? "space-y-3 rounded-lg p-3"
    : "space-y-3 rounded-lg border border-blue-500/20 bg-blue-500/15 p-3"

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm ${scene ? "min-h-[10rem] sm:min-h-[12rem] dark:bg-[#0B132B]" : ""}`}
      style={{ borderLeft: "4px solid #3b82f6" }}
    >
      {scene}
      {scene && (
        <div className="pointer-events-none absolute inset-0 bg-white/50 dark:bg-slate-950/35" />
      )}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-64"
        style={{
          background: "linear-gradient(to right, #3b82f612, transparent)"
        }}
      />

      <div className="relative p-4">
        <div className={contentShellClass}>
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 shrink-0 rounded-lg p-2 bg-blue-500/20">
              <ArrowRightLeft className="size-4.5 text-blue-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-blue-600 dark:text-blue-400">
                {title}
              </p>
              <p className={`mt-1.5 text-xs leading-relaxed ${bodyTextClass}`}>
                {description}
              </p>

              <div className="mt-3">
                {hasProgress ? (
                  <div
                    className={progressPanelClass}
                    style={{
                      backdropFilter: "blur(2px)",
                      WebkitBackdropFilter: "blur(2px)"
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className={hostChipClass}>{from}</span>
                      <ArrowRightLeft
                        className={`size-3 shrink-0 ${mutedTextClass}`}
                      />
                      <span className={hostChipClass}>{to}</span>
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "#3b82f620", color: "#2563eb" }}
                      >
                        {live ? "live" : "offline"}
                      </span>
                    </div>

                    {!phaseIsDuplicateDescription && (
                      <div
                        className={`flex items-center gap-1.5 text-xs ${mutedTextClass}`}
                      >
                        <Loader2 className="size-3 animate-spin" />
                        {phase}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <div
                          className={`flex items-center gap-3 ${mutedTextClass}`}
                        >
                          {shouldShowEta(eta) && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              ETA {formatRelativeTime(eta!)}
                            </span>
                          )}
                        </div>
                        <span className="tabular-nums text-slate-900 dark:text-slate-100">
                          {pct}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-blue-500/15">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {transferredText && (
                      <p
                        className={`text-[11px] tabular-nums ${mutedTextClass}`}
                      >
                        {transferredText}
                      </p>
                    )}

                    {reason && (
                      <p className={`text-[11px] ${mutedTextClass}`}>
                        {reason}
                      </p>
                    )}

                    <p className={`text-[11px] ${mutedTextClass}`}>
                      {live ? liveMessage : offlineMessage}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 text-xs ${mutedTextClass}`}
                  >
                    <Loader2 className="size-3 animate-spin" />
                    {fallbackMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
