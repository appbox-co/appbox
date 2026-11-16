"use client"

import { useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Badge,
  Banner,
  Button,
  Dialog,
  Empty,
  Input,
  SkeletonLine,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  CheckIcon,
  CopyIcon,
  KeyIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResult
} from "@/api/account/account"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { nextSort, SortHead, type SortState } from "../sort-head"
import { isRecentAuthError, type Reauth } from "./recent-auth"
import { RecentAuthDialog } from "./recent-auth-dialog"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "API keys",
  create: "Create API key",
  renameTitle: "Rename API key",
  revokeTitle: "Revoke API key",
  confirmRevoke: "Revoke key",
  secretTitle: "Save your API key",
  renameKey: (name: string) => `Rename ${name}`,
  revokeKey: (name: string) => `Revoke ${name}`
} as const

export interface ApiKeysViewProps {
  /** Every API key on the account, revoked and expired ones included. */
  keys: Loadable<ApiKey[]>
  /** The list was refused because the sign-in is not recent enough. */
  recentAuthRequired: boolean
  /** Creates a key. Resolves with the secret, which is shown once. */
  onCreate: (input: CreateApiKeyInput) => Promise<CreateApiKeyResult>
  onRename: (id: number, name: string) => Promise<unknown>
  onRevoke: (id: number) => Promise<unknown>
  /** Loads the list again, after signing in again with nothing waiting. */
  onRefresh: () => void
  /** How signing in again is sent. Sample pages pass a stand-in. */
  reauth: Reauth
}

/* -------------------------------------------------------------------------- */
/*  Rules, carried over from the current page                                  */
/* -------------------------------------------------------------------------- */

type ApiKeyStatus = "active" | "expired" | "revoked"

/** A change the API refused for want of a recent sign-in, to run again after one. */
type PendingApiKeyAction =
  | { type: "create"; input: CreateApiKeyInput }
  | { type: "rename"; id: number; name: string }
  | { type: "revoke"; id: number }

function getStatus(key: ApiKey): ApiKeyStatus {
  if (key.revoked_at) return "revoked"
  if (key.expires_at && new Date(key.expires_at) <= new Date()) return "expired"
  return "active"
}

const STATUS_TONE = {
  active: "success",
  expired: "warning",
  revoked: "error"
} as const

const STATUS_ORDER: ApiKeyStatus[] = ["active", "expired", "revoked"]

/* -------------------------------------------------------------------------- */
/*  Rows                                                                       */
/* -------------------------------------------------------------------------- */

interface Row {
  key: ApiKey
  status: ApiKeyStatus
}

type SortKey = "name" | "status" | "created" | "lastUsed" | "expires"
type Sort = SortState<SortKey>

const time = (value: string | null) => {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  name: (a, b) =>
    a.key.name.localeCompare(b.key.name, undefined, {
      numeric: true,
      sensitivity: "base"
    }),
  status: (a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  created: (a, b) => time(a.key.created_at) - time(b.key.created_at),
  // "Never" sorts as the earliest time.
  lastUsed: (a, b) => time(a.key.last_used_at) - time(b.key.last_used_at),
  // A key with no expiry outlasts every key that has one.
  expires: (a, b) =>
    (a.key.expires_at ? time(a.key.expires_at) : Infinity) -
      (b.key.expires_at ? time(b.key.expires_at) : Infinity) || 0
}

/* -------------------------------------------------------------------------- */
/*  Cells                                                                      */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: ApiKeyStatus }) {
  const t = useTranslations("account.apiKeys")
  return (
    <Badge variant={STATUS_TONE[status]} appearance="dot" className="shrink-0">
      {t(status)}
    </Badge>
  )
}

/** The start of the key, which is all of it that is kept. */
function Prefix({ value }: { value: string }) {
  return (
    <span className="font-mono text-[0.9em] whitespace-nowrap text-kumo-subtle">
      {value}...
    </span>
  )
}

/**
 * A date and time, as the current table shows them; how long ago (or how far
 * ahead) that is shows on hover. "Never" where there is none.
 */
function When({ value }: { value: string | null }) {
  const t = useTranslations("account.apiKeys")
  const locale = useLocale()
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return <span className="text-kumo-subtle">{t("never")}</span>
  }

  return (
    <Tooltip
      content={formatDistanceToNow(date, { addSuffix: true })}
      render={
        <time
          dateTime={value ?? undefined}
          className="whitespace-nowrap text-kumo-subtle tabular-nums"
          suppressHydrationWarning
        />
      }
    >
      {new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date)}
    </Tooltip>
  )
}

interface RowActionsProps {
  row: Row
  onRename: (key: ApiKey) => void
  onRevoke: (key: ApiKey) => void
}

/** Rename and revoke, which only a key that still works can have done to it. */
function RowActions({ row, onRename, onRevoke }: RowActionsProps) {
  const t = useTranslations("account.apiKeys")
  const disabled = row.status !== "active"

  return (
    <span className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        icon={PencilSimpleIcon}
        className="whitespace-nowrap"
        aria-label={COPY.renameKey(row.key.name)}
        disabled={disabled}
        onClick={() => onRename(row.key)}
      >
        {t("rename")}
      </Button>
      <Button
        size="sm"
        variant="secondary-destructive"
        icon={TrashIcon}
        className="whitespace-nowrap"
        aria-label={COPY.revokeKey(row.key.name)}
        disabled={disabled}
        onClick={() => onRevoke(row.key)}
      >
        {t("revoke")}
      </Button>
    </span>
  )
}

/** One key as a table row. Columns appear as the table gets room for them. */
function KeyRow(props: RowActionsProps) {
  const { key, status } = props.row

  return (
    <Table.Row>
      {/* Takes the slack and truncates. */}
      <Table.Cell className="w-full max-w-0 overflow-hidden">
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate font-medium" title={key.name}>
            {key.name}
          </span>
          {/* Until the prefix has a column of its own. */}
          <span className="truncate @min-[42rem]:hidden">
            <Prefix value={key.key_prefix} />
          </span>
        </span>
      </Table.Cell>
      <Table.Cell className="hidden @min-[42rem]:table-cell">
        <Prefix value={key.key_prefix} />
      </Table.Cell>
      <Table.Cell>
        <StatusBadge status={status} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[76rem]:table-cell">
        <When value={key.created_at} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[50rem]:table-cell">
        <When value={key.last_used_at} />
      </Table.Cell>
      <Table.Cell className="hidden @min-[60rem]:table-cell">
        <When value={key.expires_at} />
      </Table.Cell>
      <Table.Cell>
        <RowActions {...props} />
      </Table.Cell>
    </Table.Row>
  )
}

/** One key as a card, where there is no room for a table. */
function KeyCard(props: RowActionsProps) {
  const t = useTranslations("account.apiKeys")
  const { key, status } = props.row
  const facts = [
    { label: t("prefix"), value: <Prefix value={key.key_prefix} /> },
    { label: t("created"), value: <When value={key.created_at} /> },
    { label: t("lastUsed"), value: <When value={key.last_used_at} /> },
    { label: t("expiresAt"), value: <When value={key.expires_at} /> }
  ]

  return (
    <article className="grid grid-cols-1 gap-3 rounded-lg bg-kumo-base px-4 py-3.5 shadow-xs ring ring-kumo-line">
      <header className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 font-medium wrap-break-word">{key.name}</h2>
        <StatusBadge status={status} />
      </header>
      <dl className="grid grid-cols-1 gap-1.5">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-w-0 items-center justify-between gap-4"
          >
            <dt className="shrink-0 text-kumo-subtle">{fact.label}</dt>
            <dd className="flex min-w-0 justify-end">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end border-t border-kumo-hairline pt-3">
        <RowActions {...props} />
      </div>
    </article>
  )
}

function ListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="divide-y divide-kumo-hairline rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-4">
          <SkeletonLine className="h-2.5 w-40 rounded-full" />
          <SkeletonLine className="h-2.5 w-16 rounded-full" />
          <SkeletonLine className="ms-auto h-2.5 w-28 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The account's API keys as a table: create one (its secret is shown once),
 * rename or revoke one that still works. A change the API refuses for want of
 * a recent sign-in is remembered, the password is asked for again, and the
 * change then runs by itself: the current page's flow, unchanged. Where there
 * is no room for a table each key is a card.
 */
export function ApiKeysView({
  keys,
  recentAuthRequired,
  onCreate,
  onRename,
  onRevoke,
  onRefresh,
  reauth
}: ApiKeysViewProps) {
  const t = useTranslations("account.apiKeys")

  const [sort, setSort] = useState<Sort>(null)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createExpiresAt, setCreateExpiresAt] = useState("")
  const [creating, setCreating] = useState(false)

  // The new key's secret. It is forgotten once its dialog has closed.
  const [secretOpen, setSecretOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState("")
  const [copied, setCopied] = useState(false)

  // Rename and revoke. Each target outlives its dialog being open, so that
  // the dialog still shows it while it animates out.
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<ApiKey | null>(null)
  const [renameName, setRenameName] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Signing in again
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingAction, setPendingAction] =
    useState<PendingApiKeyAction | null>(null)

  const all = keys.status === "ready" ? keys.data : []
  const rows: Row[] = all.map((key) => ({ key, status: getStatus(key) }))
  // Array.sort is stable, so with no sort chosen the server's order stands.
  const ordered = sort
    ? [...rows].sort(
        (a, b) => SORTERS[sort.key](a, b) * (sort.dir === "asc" ? 1 : -1)
      )
    : rows
  const sortBy = (key: SortKey) => setSort((current) => nextSort(current, key))

  function showSecret(secret: string) {
    setCreatedSecret(secret)
    setCopied(false)
    setSecretOpen(true)
  }

  function handleRecentAuthRequired(action: PendingApiKeyAction) {
    setPendingAction(action)
    setCreateOpen(false)
    setRenameOpen(false)
    setRevokeOpen(false)
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
        const result = await onCreate(action.input)
        toast.success(t("createSuccess"))
        setCreateName("")
        setCreateExpiresAt("")
        showSecret(result.key)
      } else if (action.type === "rename") {
        await onRename(action.id, action.name)
        toast.success(t("updateSuccess"))
      } else {
        await onRevoke(action.id)
        toast.success(t("revokeSuccess"))
      }
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
    onRefresh()
  }

  function startCreate() {
    if (recentAuthRequired) {
      setReauthOpen(true)
      return
    }
    setCreateOpen(true)
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = {
      name: createName.trim(),
      expires_at: createExpiresAt
        ? new Date(createExpiresAt).toISOString()
        : null,
      // No scope chooser here yet: the live page asks for the default set.
      scopes: []
    }

    setCreating(true)
    try {
      const result = await onCreate(input)
      toast.success(t("createSuccess"))
      setCreateName("")
      setCreateExpiresAt("")
      setCreateOpen(false)
      showSecret(result.key)
    } catch (error) {
      if (isRecentAuthError(error)) {
        handleRecentAuthRequired({ type: "create", input })
        return
      }
      toast.error(t("createFailed"))
    } finally {
      setCreating(false)
    }
  }

  function startRename(key: ApiKey) {
    setRenameTarget(key)
    setRenameName(key.name)
    setRenameOpen(true)
  }

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!renameTarget) return
    const nextName = renameName.trim()

    setRenaming(true)
    try {
      await onRename(renameTarget.id, nextName)
      toast.success(t("updateSuccess"))
      setRenameOpen(false)
    } catch (error) {
      if (isRecentAuthError(error)) {
        handleRecentAuthRequired({
          type: "rename",
          id: renameTarget.id,
          name: nextName
        })
        return
      }
      toast.error(t("updateFailed"))
    } finally {
      setRenaming(false)
    }
  }

  function startRevoke(key: ApiKey) {
    setRevokeTarget(key)
    setRevokeOpen(true)
  }

  async function confirmRevoke() {
    if (!revokeTarget) return

    setRevoking(true)
    try {
      await onRevoke(revokeTarget.id)
      toast.success(t("revokeSuccess"))
      setRevokeOpen(false)
    } catch (error) {
      if (isRecentAuthError(error)) {
        handleRecentAuthRequired({ type: "revoke", id: revokeTarget.id })
        return
      }
      toast.error(t("revokeFailed"))
    } finally {
      setRevoking(false)
    }
  }

  async function copySecret() {
    await navigator.clipboard.writeText(createdSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rowProps = (row: Row): RowActionsProps => ({
    row,
    onRename: startRename,
    onRevoke: startRevoke
  })

  const createButton = (
    <Button variant="primary" icon={PlusIcon} onClick={startCreate}>
      {COPY.create}
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-prose gap-1.5">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold">
            <KeyIcon aria-hidden="true" size={24} />
            {COPY.title}
          </h1>
          <p className="text-kumo-subtle">{t("description")}</p>
        </div>
        {createButton}
      </header>

      {/* The container the table's columns and the card fallback respond to. */}
      <div className="@container grid min-w-0 grid-cols-1 gap-3">
        {keys.status === "loading" && <ListSkeleton />}

        {keys.status === "error" && !recentAuthRequired && (
          <Banner
            variant="error"
            icon={<WarningCircleIcon weight="fill" />}
            title={t("loadFailed")}
          />
        )}

        {recentAuthRequired && (
          <Banner
            variant="alert"
            icon={<WarningIcon weight="fill" />}
            title={t("reauthRequired")}
            action={
              <Button size="sm" onClick={() => setReauthOpen(true)}>
                {t("reauthSubmit")}
              </Button>
            }
          />
        )}

        {keys.status === "ready" && rows.length === 0 && (
          <div className="rounded-lg bg-kumo-base ring ring-kumo-hairline">
            <Empty
              className={EMPTY_IN_CARD}
              icon={<KeyIcon size={40} />}
              title={t("noKeys")}
              description={t("description")}
              contents={createButton}
            />
          </div>
        )}

        {ordered.length > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line @xl:block">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <SortHead
                      label={t("name")}
                      sortKey="name"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <Table.Head className="hidden @min-[42rem]:table-cell">
                      {t("prefix")}
                    </Table.Head>
                    <SortHead
                      label={t("status")}
                      sortKey="status"
                      sort={sort}
                      onSort={sortBy}
                    />
                    <SortHead
                      label={t("created")}
                      sortKey="created"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[76rem]:table-cell"
                    />
                    <SortHead
                      label={t("lastUsed")}
                      sortKey="lastUsed"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[50rem]:table-cell"
                    />
                    <SortHead
                      label={t("expiresAt")}
                      sortKey="expires"
                      sort={sort}
                      onSort={sortBy}
                      className="hidden @min-[60rem]:table-cell"
                    />
                    <Table.Head>
                      <span className="sr-only">{t("actions")}</span>
                    </Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {ordered.map((row) => (
                    <KeyRow key={row.key.id} {...rowProps(row)} />
                  ))}
                </Table.Body>
              </Table>
            </div>

            <ul className="grid list-none grid-cols-1 gap-3 @xl:hidden">
              {ordered.map((row) => (
                <li key={row.key.id} className="min-w-0">
                  <KeyCard {...rowProps(row)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Create a key */}
      <Dialog.Root
        open={createOpen}
        onOpenChange={(open) => {
          if (!open && creating) return
          setCreateOpen(open)
        }}
      >
        <Dialog className="px-6 py-5">
          <form onSubmit={submitCreate} className="grid grid-cols-1 gap-5">
            <div className="grid gap-1.5">
              <Dialog.Title className="text-lg font-semibold">
                {COPY.create}
              </Dialog.Title>
              <Dialog.Description className="text-kumo-subtle">
                {t("createDescription")}
              </Dialog.Description>
            </div>

            <Input
              id="api-key-name"
              label={t("name")}
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
              autoComplete="off"
              passwordManagerIgnore
              required
            />

            <Input
              id="api-key-expires"
              type="datetime-local"
              label={
                <>
                  {t("expiresAt")}{" "}
                  <span className="font-normal text-kumo-subtle">
                    ({t("optional")})
                  </span>
                </>
              }
              value={createExpiresAt}
              onChange={(event) => setCreateExpiresAt(event.target.value)}
              className="tabular-nums"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={creating}
                loading={creating}
              >
                {COPY.create}
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      {/* Sign in again */}
      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={handleReauthOpenChange}
        onVerified={handleReauthVerified}
        reauth={reauth}
      />

      {/* The new key's secret, shown this once. It takes a deliberate close:
          a stray click outside must not lose it. */}
      <Dialog.Root
        role="alertdialog"
        open={secretOpen}
        onOpenChange={(open) => {
          if (!open) setSecretOpen(false)
        }}
        onOpenChangeComplete={(open) => {
          if (!open) setCreatedSecret("")
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <KeyIcon aria-hidden="true" size={20} />
              {COPY.secretTitle}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("secretDescription")}
            </Dialog.Description>
          </div>

          <code className="block rounded-lg bg-kumo-elevated p-3 font-mono text-[0.9em] break-all ring ring-kumo-hairline">
            {createdSecret}
          </code>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              icon={
                copied ? <CheckIcon className="text-kumo-success" /> : CopyIcon
              }
              onClick={() => void copySecret()}
            >
              {copied ? t("copied") : t("copy")}
            </Button>
            <Button variant="primary" onClick={() => setSecretOpen(false)}>
              {t("close")}
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>

      {/* Rename a key */}
      <Dialog.Root
        open={renameOpen}
        onOpenChange={(open) => {
          if (!open && !renaming) setRenameOpen(false)
        }}
      >
        <Dialog className="px-6 py-5">
          <form onSubmit={submitRename} className="grid grid-cols-1 gap-5">
            <Dialog.Title className="text-lg font-semibold">
              {COPY.renameTitle}
            </Dialog.Title>

            <Input
              id="rename-api-key"
              label={t("name")}
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              maxLength={100}
              autoComplete="off"
              passwordManagerIgnore
              required
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={renaming}
                loading={renaming}
              >
                {t("save")}
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      {/* Revoke a key */}
      <Dialog.Root
        role="alertdialog"
        open={revokeOpen}
        onOpenChange={(open) => {
          if (!open && !revoking) setRevokeOpen(false)
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {COPY.revokeTitle}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("revokeDescription")}
            </Dialog.Description>
          </div>

          {revokeTarget && (
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-kumo-elevated px-3 py-2.5 ring ring-kumo-hairline">
              <span className="min-w-0 font-medium wrap-break-word">
                {revokeTarget.name}
              </span>
              <Prefix value={revokeTarget.key_prefix} />
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setRevokeOpen(false)}
              disabled={revoking}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmRevoke()}
              disabled={revoking}
              loading={revoking}
            >
              {COPY.confirmRevoke}
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
