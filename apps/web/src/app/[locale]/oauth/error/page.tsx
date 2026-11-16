import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { Link } from "@/i18n/routing"

// Errors /oauth/authorize sends here instead of back to the client: anything
// found before the client's redirect URI is trusted, every authorization
// request error for HTTPS redirect URIs, and rate limiting.
const KNOWN_ERRORS = [
  "invalid_request",
  "invalid_client",
  "invalid_client_metadata",
  "unsupported_response_type",
  "invalid_target",
  "invalid_scope",
  "temporarily_unavailable"
] as const

type KnownError = (typeof KNOWN_ERRORS)[number]

function firstParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value
  return typeof text === "string" ? text.slice(0, 500) : ""
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "oauth.error" })
  return { title: t("metaTitle") }
}

export default async function OAuthErrorPage(props: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await props.params
  const searchParams = await props.searchParams
  const t = await getTranslations({ locale, namespace: "oauth.error" })

  const error = firstParam(searchParams.error)
  const description = firstParam(searchParams.error_description)
  const rateLimited = error === "temporarily_unavailable"
  const hint = (KNOWN_ERRORS as readonly string[]).includes(error)
    ? t(`hints.${error as KnownError}`)
    : t("description")

  return (
    <div className="space-y-5 rounded-xl border bg-card p-6">
      <div
        className={
          rateLimited
            ? "flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
            : "flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        }
      >
        {rateLimited ? (
          <Clock className="size-5" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-5" aria-hidden="true" />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-lg font-semibold">
          {rateLimited ? t("rateLimitedTitle") : t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      {/* The server's own description, shown as given (it is English). */}
      {(description || error) && (
        <div className="space-y-1 border-l-2 border-muted-foreground/30 py-1 pl-3 text-sm">
          {description && <p className="break-words">{description}</p>}
          {error && (
            <p className="text-xs text-muted-foreground">
              {t("codeLabel")}{" "}
              <code className="break-all bg-muted px-1 py-0.5 font-mono">
                {error}
              </code>
            </p>
          )}
        </div>
      )}

      <p className="text-sm">
        {rateLimited ? t("rateLimitedTryAgain") : t("tryAgain")}
      </p>

      <Button asChild variant="outline">
        <Link href={ROUTES.DASHBOARD}>{t("dashboard")}</Link>
      </Button>
    </div>
  )
}
