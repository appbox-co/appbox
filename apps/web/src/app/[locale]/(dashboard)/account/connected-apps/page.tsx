"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, Loader2, PlugZap, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useApiKeyScopes } from "@/api/account/hooks/use-account"
import {
  useOAuthGrants,
  useRevokeOAuthGrant
} from "@/api/oauth/hooks/use-oauth"
import type { OAuthGrant } from "@/api/oauth/oauth"
import { ApiKeyScopeSummary } from "@/components/account/api-key-scope-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { isNextLaunchWeekEnabled } from "@/config/launch-week-flags"
import { useAuth } from "@/providers/auth-provider"
import { AccountPageHeader } from "../_components/account-page-header"

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

function RevokeGrantDialog({
  grant,
  onOpenChange
}: {
  grant: OAuthGrant | null
  onOpenChange: (grant: OAuthGrant | null) => void
}) {
  const t = useTranslations("account.connectedApps")
  const revokeGrant = useRevokeOAuthGrant()

  async function handleRevoke() {
    if (!grant) return
    try {
      await revokeGrant.mutateAsync(grant.id)
      toast.success(t("revokeSuccess", { client: grant.client_name }))
      onOpenChange(null)
    } catch {
      toast.error(t("revokeFailed"))
    }
  }

  return (
    <Dialog open={!!grant} onOpenChange={(open) => !open && onOpenChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t("revokeTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("revokeDescription", { client: grant?.client_name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(null)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={revokeGrant.isPending}
          >
            {revokeGrant.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {t("confirmRevoke")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConnectedAppsList() {
  const t = useTranslations("account.connectedApps")
  const { data: grants = [], isLoading, error } = useOAuthGrants()
  const { data: scopeCatalog } = useApiKeyScopes()
  const [revokeGrant, setRevokeGrant] = useState<OAuthGrant | null>(null)

  return (
    <>
      <p className="border-l-2 border-primary/60 py-1 pl-4 text-sm text-muted-foreground">
        {t("explainer")}
      </p>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {t("loadFailed")}
        </div>
      )}

      {!isLoading && !error && grants.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <PlugZap className="size-10 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("empty")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && grants.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("client")}</TableHead>
                <TableHead>{t("scopes")}</TableHead>
                <TableHead>{t("created")}</TableHead>
                <TableHead>{t("lastUsed")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell className="max-w-64">
                    <div className="font-medium break-words">
                      {grant.client_name}
                    </div>
                    <div
                      className="truncate font-mono text-[11px] text-muted-foreground"
                      title={grant.client_id}
                    >
                      {grant.client_id}
                    </div>
                    {grant.client_kind !== "first_party" && (
                      <div className="text-xs text-muted-foreground">
                        {t("unverified")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ApiKeyScopeSummary
                      name={grant.client_name}
                      scopes={grant.scopes}
                      catalog={scopeCatalog}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(grant.created_at, t("never"))}
                  </TableCell>
                  <TableCell>
                    {formatDate(grant.last_used_at, t("never"))}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeGrant(grant)}
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        {t("revoke")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RevokeGrantDialog grant={revokeGrant} onOpenChange={setRevokeGrant} />
    </>
  )
}

export default function ConnectedAppsPage() {
  const t = useTranslations("account.connectedApps")
  const { isAdmin } = useAuth()

  if (!isNextLaunchWeekEnabled("day_5", isAdmin)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("notAvailable")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title={t("title")}
        description={t("description")}
        icon={<PlugZap className="size-[18px]" />}
        gradient="from-[#06b6d4] to-[#0891b2]"
      />
      <ConnectedAppsList />
    </div>
  )
}
