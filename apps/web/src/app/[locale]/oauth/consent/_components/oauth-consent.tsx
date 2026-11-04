"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Clock,
  Loader2,
  PlugZap,
  ShieldAlert,
  ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { getApiKeyScopes, type ApiKeyScopeCatalog } from "@/api/account/account"
import { ApiError } from "@/api/client"
import {
  decideOAuthConsentRequest,
  getOAuthConsentRequest,
  type OAuthConsentRequest
} from "@/api/oauth/oauth"
import {
  ApiKeyScopePicker,
  scopePickerHintId
} from "@/components/account/api-key-scope-picker"
import {
  isRecentAuthError,
  RecentAuthDialog
} from "@/components/account/recent-auth-dialog"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/constants/query-keys"
import { getPathname } from "@/i18n/routing"

const SCOPE_PICKER_ID = "oauth-consent"

type LoadState =
  | { status: "loading" }
  | { status: "expired" }
  | { status: "failed" }
  | { status: "ready"; request: OAuthConsentRequest }

// The server refuses these as redirect URIs; check again before navigating.
const BLOCKED_REDIRECT_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
  "about:"
])

function safeClientRedirect(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null
  try {
    const url = new URL(value)
    return BLOCKED_REDIRECT_PROTOCOLS.has(url.protocol) ? null : value
  } catch {
    return null
  }
}

/** No session, or a signed-out (blacklisted) one. */
function isSignInRequired(error: unknown) {
  if (!(error instanceof ApiError)) return false
  if (error.status === 401) return true
  return (
    error.status === 403 &&
    error.message.toLowerCase().includes("malformed auth token")
  )
}

function apiErrorDetail(error: unknown) {
  if (!(error instanceof ApiError)) return undefined
  if (error.status < 400 || error.status >= 500) return undefined
  return error.message || undefined
}

/**
 * Sends the browser to sign in and back here with the request intact. The
 * root query client would also redirect on a 401, but without `redirect`,
 * so this page loads its data with plain requests instead of React Query.
 */
function sendToLogin(locale: string) {
  const redirect = `${window.location.pathname}${window.location.search}`
  const login = getPathname({ href: "/login", locale })
  window.location.assign(`${login}?redirect=${encodeURIComponent(redirect)}`)
}

/**
 * Loads the request and the scope catalog. Returns null when the browser is
 * being sent to sign in.
 */
async function loadConsent(
  requestId: string,
  locale: string,
  onCatalog: (catalog: ApiKeyScopeCatalog) => void
): Promise<LoadState | null> {
  const [request, catalog] = await Promise.allSettled([
    getOAuthConsentRequest(requestId),
    getApiKeyScopes()
  ])

  if (request.status === "rejected") {
    if (isSignInRequired(request.reason)) {
      sendToLogin(locale)
      return null
    }
    if (request.reason instanceof ApiError && request.reason.status === 404) {
      return { status: "expired" }
    }
    return { status: "failed" }
  }

  if (catalog.status === "fulfilled") onCatalog(catalog.value)
  return { status: "ready", request: request.value }
}

function StatusCard({
  icon,
  title,
  description,
  children
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ConsentSkeleton() {
  const t = useTranslations("oauth.consent")
  return (
    <div
      className="space-y-4 rounded-xl border bg-card p-6"
      role="status"
      aria-label={t("loading")}
    >
      <div className="size-10 rounded-lg bg-muted motion-safe:animate-pulse" />
      <div className="h-5 w-2/3 bg-muted motion-safe:animate-pulse" />
      <div className="h-3 w-full bg-muted/70 motion-safe:animate-pulse" />
      <div className="h-3 w-5/6 bg-muted/70 motion-safe:animate-pulse" />
      <div className="h-40 w-full bg-muted/50 motion-safe:animate-pulse" />
    </div>
  )
}

export function OAuthConsent() {
  const t = useTranslations("oauth.consent")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const requestId = searchParams.get("request") ?? ""

  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  // null until the request loads, then the requested scopes until the user
  // changes the selection.
  const [scopes, setScopes] = useState<string[] | null>(null)
  const [pending, setPending] = useState<"approve" | "deny" | null>(null)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [returningTo, setReturningTo] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    let cancelled = false

    loadConsent(requestId, locale, (catalog) => {
      // Seed the picker's query so it doesn't fetch the catalog itself: a
      // 401 from React Query would redirect to /login without the request.
      queryClient.setQueryData(queryKeys.apiKeys.scopeCatalog, catalog)
    }).then((next) => {
      if (!cancelled && next) setState(next)
    })

    return () => {
      cancelled = true
    }
  }, [requestId, locale, queryClient, attempt])

  if (!requestId) {
    return (
      <StatusCard
        icon={<PlugZap className="size-5" />}
        title={t("missingTitle")}
        description={t("missingDescription")}
      />
    )
  }

  if (state.status === "loading") return <ConsentSkeleton />

  if (state.status === "expired") {
    return (
      <StatusCard
        icon={<Clock className="size-5" />}
        title={t("expiredTitle")}
        description={t("expiredDescription")}
      />
    )
  }

  if (state.status === "failed") {
    return (
      <StatusCard
        icon={<AlertTriangle className="size-5" />}
        title={t("loadFailed")}
        description={t("loadFailedDescription")}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setState({ status: "loading" })
            setAttempt((current) => current + 1)
          }}
        >
          {t("retry")}
        </Button>
      </StatusCard>
    )
  }

  const { request } = state
  const client = request.client
  const selectedScopes = scopes ?? request.scopes
  const missingScopes = selectedScopes.length === 0
  const busy = pending !== null || returningTo !== null

  if (returningTo !== null) {
    return (
      <StatusCard
        icon={<Loader2 className="size-5 motion-safe:animate-spin" />}
        title={t("returningTitle", { host: returningTo })}
        description={t("returningDescription")}
      />
    )
  }

  async function decide(approve: boolean) {
    setPending(approve ? "approve" : "deny")
    try {
      const result = await decideOAuthConsentRequest(
        request.id,
        approve ? { approve, scopes: selectedScopes } : { approve }
      )
      const target = safeClientRedirect(result?.redirect_to)
      if (!target) throw new Error("The response had no usable redirect.")
      setReturningTo(client.redirect_host)
      window.location.assign(target)
    } catch (error) {
      if (approve && isRecentAuthError(error)) {
        setReauthOpen(true)
        return
      }
      if (isSignInRequired(error)) {
        sendToLogin(locale)
        return
      }
      if (error instanceof ApiError && error.status === 404) {
        setState({ status: "expired" })
        return
      }
      toast.error(approve ? t("approveFailed") : t("denyFailed"), {
        description: apiErrorDetail(error)
      })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
      <div className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white">
          <PlugZap className="size-5" aria-hidden="true" />
        </div>
        <h1 className="break-words text-xl font-semibold">
          {t.rich("title", {
            client: client.name,
            name: (chunks) => <span className="text-primary">{chunks}</span>
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("description", { client: client.name })}
        </p>
      </div>

      {!client.verified && (
        <div
          role="note"
          className="flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/5 py-2 pl-3 pr-2 text-sm text-amber-800 dark:text-amber-200"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-medium">{t("unverifiedTitle")}</p>
            <p>{t("unverifiedDescription")}</p>
          </div>
        </div>
      )}

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">{t("redirectLabel")}</dt>
        <dd>
          <code className="break-all bg-muted px-1 py-0.5 font-mono text-xs">
            {client.redirect_host}
          </code>
        </dd>
        <dt className="text-muted-foreground">{t("clientIdLabel")}</dt>
        <dd>
          <code className="break-all bg-muted px-1 py-0.5 font-mono text-xs">
            {client.client_id}
          </code>
        </dd>
      </dl>

      {client.loopback_only && (
        <div
          role="note"
          className="flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/5 py-2 pl-3 pr-2 text-sm text-amber-800 dark:text-amber-200"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>{t("loopbackWarning", { host: client.redirect_host })}</p>
        </div>
      )}

      {request.eligible ? (
        <>
          <ApiKeyScopePicker
            idPrefix={SCOPE_PICKER_ID}
            value={selectedScopes}
            onChange={setScopes}
            disabled={busy}
            messages={{
              help: t("scopesHelp", { client: client.name }),
              required: t("scopesRequired"),
              higherRiskNotice: t("higherRiskNotice")
            }}
          />

          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck
                className="mt-px size-3.5 shrink-0"
                aria-hidden="true"
              />
              {t("neverAllowed")}
            </p>
            <p className="pl-5.5">{t("revokeHint")}</p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => decide(false)}
            >
              {pending === "deny" && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("deny")}
            </Button>
            <Button
              type="button"
              disabled={busy || missingScopes}
              aria-describedby={
                missingScopes ? scopePickerHintId(SCOPE_PICKER_ID) : undefined
              }
              onClick={() => decide(true)}
            >
              {pending === "approve" && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("approve")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div
            role="alert"
            className="flex items-start gap-2 border-l-2 border-destructive bg-destructive/5 py-2 pl-3 pr-2 text-sm text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="font-medium">{t("ineligibleTitle")}</p>
              <p>{t("ineligibleDescription")}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => decide(false)}
            >
              {pending === "deny" && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("cancelAndReturn", { host: client.redirect_host })}
            </Button>
          </div>
        </>
      )}

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={() => decide(true)}
        messages={{ description: t("reauthDescription") }}
        idPrefix="oauth-consent-reauth"
      />
    </div>
  )
}
