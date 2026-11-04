import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { Link } from "@/i18n/routing"

// Errors /oauth/authorize sends here, before the client's redirect URI is
// trusted. Anything else goes back to the client.
const KNOWN_ERRORS = [
  "invalid_request",
  "invalid_client",
  "invalid_client_metadata"
] as const

type KnownError = (typeof KNOWN_ERRORS)[number]

function firstParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value
  return typeof text === "string" ? text.slice(0, 300) : ""
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
  const hint = (KNOWN_ERRORS as readonly string[]).includes(error)
    ? t(`hints.${error as KnownError}`)
    : null

  return (
    <div className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>

      {(error || description) && (
        <dl className="grid gap-x-4 gap-y-2 border-l-2 border-muted-foreground/30 py-1 pl-3 text-sm sm:grid-cols-[auto_1fr]">
          {error && (
            <>
              <dt className="text-muted-foreground">{t("codeLabel")}</dt>
              <dd>
                <code className="break-all bg-muted px-1 py-0.5 font-mono text-xs">
                  {error}
                </code>
              </dd>
            </>
          )}
          {description && (
            <>
              <dt className="text-muted-foreground">{t("detailsLabel")}</dt>
              <dd className="break-words">{description}</dd>
            </>
          )}
        </dl>
      )}

      <Button asChild variant="outline">
        <Link href={ROUTES.DASHBOARD}>{t("dashboard")}</Link>
      </Button>
    </div>
  )
}
