"use client"

import { FormEvent, useState } from "react"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import {
  createApiKey as createApiKeyRequest,
  revokeApiKey as revokeApiKeyRequest,
  updateApiKey as updateApiKeyRequest,
  type ApiKey,
  type CreateApiKeyInput
} from "@/api/account/account"
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useUpdateApiKey
} from "@/api/account/hooks/use-account"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { queryKeys } from "@/constants/query-keys"
import { AccountPageHeader } from "../_components/account-page-header"
import {
  isRecentAuthError,
  RecentAuthDialog
} from "../_components/recent-auth-dialog"

type ApiKeyStatus = "active" | "expired" | "revoked"
type PendingApiKeyAction =
  | { type: "create"; input: CreateApiKeyInput }
  | { type: "rename"; id: number; name: string }
  | { type: "revoke"; id: number }

function getStatus(key: ApiKey): ApiKeyStatus {
  if (key.revoked_at) return "revoked"
  if (key.expires_at && new Date(key.expires_at) <= new Date()) return "expired"
  return "active"
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

function statusVariant(status: ApiKeyStatus) {
  if (status === "active") return "secondary" as const
  if (status === "revoked") return "destructive" as const
  return "outline" as const
}

function ApiKeySecretDialog({
  secret,
  onClose
}: {
  secret: string
  onClose: () => void
}) {
  const t = useTranslations("account.apiKeys")
  const [copied, setCopied] = useState(false)

  async function copySecret() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={!!secret} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-muted-foreground" />
            {t("secretTitle")}
          </DialogTitle>
          <DialogDescription>{t("secretDescription")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3">
          <code className="block break-all text-sm">{secret}</code>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={copySecret}>
            {copied ? (
              <>
                <Check className="mr-2 size-4 text-emerald-500" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                {t("copy")}
              </>
            )}
          </Button>
          <Button type="button" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
  onRecentAuthRequired
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (secret: string) => void
  onRecentAuthRequired: (action: PendingApiKeyAction) => void
}) {
  const t = useTranslations("account.apiKeys")
  const createApiKey = useCreateApiKey()
  const [name, setName] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = {
      name: name.trim(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
    }

    try {
      const result = await createApiKey.mutateAsync(input)
      toast.success(t("createSuccess"))
      setName("")
      setExpiresAt("")
      onOpenChange(false)
      onCreated(result.key)
    } catch (error) {
      if (isRecentAuthError(error)) {
        onRecentAuthRequired({ type: "create", input })
        return
      }
      toast.error(t("createFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="api-key-name">{t("name")}</Label>
            <Input
              id="api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key-expires">
              {t("expiresAt")}{" "}
              <span className="text-muted-foreground">({t("optional")})</span>
            </Label>
            <Input
              id="api-key-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createApiKey.isPending}>
              {createApiKey.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RenameApiKeyDialog({
  apiKey,
  onOpenChange,
  onRecentAuthRequired
}: {
  apiKey: ApiKey | null
  onOpenChange: (apiKey: ApiKey | null) => void
  onRecentAuthRequired: (action: PendingApiKeyAction) => void
}) {
  const t = useTranslations("account.apiKeys")
  const updateApiKey = useUpdateApiKey(apiKey?.id ?? 0)
  const [name, setName] = useState(apiKey?.name ?? "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!apiKey) return
    const nextName = name.trim()

    try {
      await updateApiKey.mutateAsync({ name: nextName })
      toast.success(t("updateSuccess"))
      onOpenChange(null)
    } catch (error) {
      if (isRecentAuthError(error)) {
        onOpenChange(null)
        onRecentAuthRequired({
          type: "rename",
          id: apiKey.id,
          name: nextName
        })
        return
      }
      toast.error(t("updateFailed"))
    }
  }

  return (
    <Dialog
      open={!!apiKey}
      onOpenChange={(open) => {
        if (!open) onOpenChange(null)
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rename-api-key">{t("name")}</Label>
            <Input
              id="rename-api-key"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(null)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={updateApiKey.isPending}>
              {updateApiKey.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RevokeApiKeyDialog({
  apiKey,
  onOpenChange,
  onRecentAuthRequired
}: {
  apiKey: ApiKey | null
  onOpenChange: (apiKey: ApiKey | null) => void
  onRecentAuthRequired: (action: PendingApiKeyAction) => void
}) {
  const t = useTranslations("account.apiKeys")
  const revokeApiKey = useRevokeApiKey()

  async function handleRevoke() {
    if (!apiKey) return
    try {
      await revokeApiKey.mutateAsync(apiKey.id)
      toast.success(t("revokeSuccess"))
      onOpenChange(null)
    } catch (error) {
      if (isRecentAuthError(error)) {
        onOpenChange(null)
        onRecentAuthRequired({ type: "revoke", id: apiKey.id })
        return
      }
      toast.error(t("revokeFailed"))
    }
  }

  return (
    <Dialog
      open={!!apiKey}
      onOpenChange={(open) => !open && onOpenChange(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t("revokeTitle")}
          </DialogTitle>
          <DialogDescription>{t("revokeDescription")}</DialogDescription>
        </DialogHeader>

        {apiKey && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="font-medium">{apiKey.name}</span>
            <span className="ml-2 text-muted-foreground">
              {apiKey.key_prefix}...
            </span>
          </div>
        )}

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
            disabled={revokeApiKey.isPending}
          >
            {revokeApiKey.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {t("confirmRevoke")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ApiKeysPage() {
  const t = useTranslations("account.apiKeys")
  const queryClient = useQueryClient()
  const { data: apiKeys = [], isLoading, error } = useApiKeys()
  const [createOpen, setCreateOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState("")
  const [renameKey, setRenameKey] = useState<ApiKey | null>(null)
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingAction, setPendingAction] =
    useState<PendingApiKeyAction | null>(null)

  const recentAuthRequired = isRecentAuthError(error)

  function handleRecentAuthRequired(action: PendingApiKeyAction) {
    setPendingAction(action)
    setCreateOpen(false)
    setRenameKey(null)
    setRevokeKey(null)
    setReauthOpen(true)
  }

  function handleReauthOpenChange(open: boolean) {
    if (!open) {
      setPendingAction(null)
    }
    setReauthOpen(open)
  }

  async function replayPendingAction(action: PendingApiKeyAction) {
    try {
      if (action.type === "create") {
        const result = await createApiKeyRequest(action.input)
        toast.success(t("createSuccess"))
        setCreatedSecret(result.key)
      } else if (action.type === "rename") {
        await updateApiKeyRequest(action.id, { name: action.name })
        toast.success(t("updateSuccess"))
      } else {
        await revokeApiKeyRequest(action.id)
        toast.success(t("revokeSuccess"))
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
    } catch {
      if (action.type === "create") {
        toast.error(t("createFailed"))
      } else if (action.type === "rename") {
        toast.error(t("updateFailed"))
      } else {
        toast.error(t("revokeFailed"))
      }
    } finally {
      setPendingAction(null)
    }
  }

  async function handleReauthVerified() {
    if (pendingAction) {
      await replayPendingAction(pendingAction)
      return
    }

    toast.success(t("reauthSuccess"))
    queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title={t("title")}
        description={t("description")}
        icon={<KeyRound className="size-[18px]" />}
        gradient="from-[#06b6d4] to-[#0891b2]"
        action={
          <Button
            onClick={() => {
              if (recentAuthRequired) {
                setReauthOpen(true)
                return
              }
              setCreateOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" />
            {t("create")}
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
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

      {error && !recentAuthRequired && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {t("loadFailed")}
        </div>
      )}

      {recentAuthRequired && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            {t("reauthRequired")}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReauthOpen(true)}
          >
            {t("reauthSubmit")}
          </Button>
        </div>
      )}

      {!isLoading && !error && apiKeys.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <KeyRound className="size-10 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("noKeys")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <Button
            onClick={() => {
              if (recentAuthRequired) {
                setReauthOpen(true)
                return
              }
              setCreateOpen(true)
            }}
            variant="outline"
          >
            <Plus className="mr-2 size-4" />
            {t("create")}
          </Button>
        </div>
      )}

      {!isLoading && !error && apiKeys.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("prefix")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("created")}</TableHead>
                <TableHead>{t("lastUsed")}</TableHead>
                <TableHead>{t("expiresAt")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => {
                const status = getStatus(apiKey)
                const disabled = status !== "active"
                return (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {apiKey.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(status)}>{t(status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(apiKey.created_at, t("never"))}
                    </TableCell>
                    <TableCell>
                      {formatDate(apiKey.last_used_at, t("never"))}
                    </TableCell>
                    <TableCell>
                      {formatDate(apiKey.expires_at, t("never"))}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={disabled}
                          onClick={() => setRenameKey(apiKey)}
                        >
                          <Pencil className="mr-2 size-3.5" />
                          {t("rename")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={disabled}
                          onClick={() => setRevokeKey(apiKey)}
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          {t("revoke")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateApiKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setCreatedSecret}
        onRecentAuthRequired={handleRecentAuthRequired}
      />
      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={handleReauthOpenChange}
        onVerified={handleReauthVerified}
      />
      <ApiKeySecretDialog
        secret={createdSecret}
        onClose={() => setCreatedSecret("")}
      />
      <RenameApiKeyDialog
        key={renameKey?.id ?? "rename-api-key"}
        apiKey={renameKey}
        onOpenChange={setRenameKey}
        onRecentAuthRequired={handleRecentAuthRequired}
      />
      <RevokeApiKeyDialog
        apiKey={revokeKey}
        onOpenChange={setRevokeKey}
        onRecentAuthRequired={handleRecentAuthRequired}
      />
    </div>
  )
}
