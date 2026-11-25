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
import { toast } from "sonner"
import type {
  ApiKey,
  ApiKeyScopeCatalog,
  CreateApiKeyInput,
  CreateApiKeyResult,
  UpdateApiKeyInput
} from "@/api/account/account"
import { isRecentAuthError } from "@/api/account/reauth"
// Pure rules shared with the current design's page.
import {
  getDefaultScopes,
  hasSameScopes
} from "@/components/account/api-key-scopes"
import { EMPTY_IN_CARD, type Loadable } from "../shared"
import { useRelativeTime } from "../ui/short-date"
import { ListSkeleton } from "../ui/skeletons"
import {
  compareText,
  nextSort,
  SortHead,
  sortRows,
  timeOf,
  type SortState
} from "../ui/sort-head"
import { RecentAuthDialog } from "./recent-auth-dialog"
import { ScopePicker, scopesHintId, ScopeSummary } from "./scope-picker"

/**
 * Prototype-only copy, in English and sentence case (a Kumo rule the existing
 * translation strings do not follow) until the direction is agreed.
 */
const COPY = {
  title: "API keys",
  create: "Create API key",
  editTitle: "Edit API key",
  revokeTitle: "Revoke API key",
  confirmRevoke: "Revoke key",
  secretTitle: "Save your API key",
  editKey: (name: string) => `Edit ${name}`,
  revokeKey: (name: string) => `Revoke ${name}`
} as const

export interface ApiKeysViewProps {
  /** Every API key on the account, revoked and expired ones included. */
  keys: Loadable<ApiKey[]>
  /** The list was refused because the sign-in is not recent enough. */
  recentAuthRequired: boolean
  /** Creates a key. Resolves with the secret, which is shown once. */
  onCreate: (input: CreateApiKeyInput) => Promise<CreateApiKeyResult>
  /** Changes a key's name, its scopes, or both. */
  onUpdate: (id: number, input: UpdateApiKeyInput) => Promise<unknown>
  onRevoke: (id: number) => Promise<unknown>
  /** Loads the list again, after signing in again with nothing waiting. */
  onRefresh: () => void
  /** The scopes a key can have, and the presets made from them. */
  scopeCatalog: Loadable<ApiKeyScopeCatalog>
  onRetryScopes: () => void
}

/* -------------------------------------------------------------------------- */
/*  Rules, carried over from the current page                                  */
/* -------------------------------------------------------------------------- */

type ApiKeyStatus = "active" | "expired" | "revoked"

/** A change the API refused for want of a recent sign-in, to run again after one. */
type PendingApiKeyAction =
  | { type: "create"; input: CreateApiKeyInput }
  | { type: "update"; id: number; input: UpdateApiKeyInput }
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

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  name: (a, b) => compareText(a.key.name, b.key.name),
  status: (a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  created: (a, b) => timeOf(a.key.created_at) - timeOf(b.key.created_at),
  // "Never" sorts as the earliest time.
  lastUsed: (a, b) => timeOf(a.key.last_used_at) - timeOf(b.key.last_used_at),
  // A key with no expiry outlasts every key that has one.
  expires: (a, b) =>
    (a.key.expires_at ? timeOf(a.key.expires_at) : Infinity) -
      (b.key.expires_at ? timeOf(b.key.expires_at) : Infinity) || 0
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
  const relativeTime = useRelativeTime()
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return <span className="text-kumo-subtle">{t("never")}</span>
  }

  return (
    <Tooltip
      content={relativeTime(date)}
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
  catalog: ApiKeyScopeCatalog | undefined
  onEdit: (key: ApiKey) => void
  onRevoke: (key: ApiKey) => void
}

/** Edit and revoke, which only a key that still works can have done to it. */
function RowActions({ row, onEdit, onRevoke }: RowActionsProps) {
  const t = useTranslations("account.apiKeys")
  const disabled = row.status !== "active"

  return (
    <span className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        icon={PencilSimpleIcon}
        className="whitespace-nowrap"
        aria-label={COPY.editKey(row.key.name)}
        disabled={disabled}
        onClick={() => onEdit(row.key)}
      >
        {t("edit")}
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
      <Table.Cell>
        <ScopeSummary
          name={key.name}
          scopes={key.scopes}
          catalog={props.catalog}
          muted={status !== "active"}
        />
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
    {
      label: t("scopes"),
      value: (
        <ScopeSummary
          name={key.name}
          scopes={key.scopes}
          catalog={props.catalog}
          muted={status !== "active"}
        />
      )
    },
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

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The account's API keys as a table: create one with the scopes it may use
 * (its secret is shown once), edit or revoke one that still works. A change the API refuses for want of
 * a recent sign-in is remembered, the password is asked for again, and the
 * change then runs by itself: the current page's flow, unchanged. Where there
 * is no room for a table each key is a card.
 */
export function ApiKeysView({
  keys,
  recentAuthRequired,
  onCreate,
  onUpdate,
  onRevoke,
  onRefresh,
  scopeCatalog,
  onRetryScopes
}: ApiKeysViewProps) {
  const t = useTranslations("account.apiKeys")

  const [sort, setSort] = useState<Sort>(null)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createExpiresAt, setCreateExpiresAt] = useState("")
  // Null until a scope is chosen, so the default preset applies as soon as
  // the scope list arrives.
  const [createScopes, setCreateScopes] = useState<string[] | null>(null)
  const [creating, setCreating] = useState(false)

  // The new key's secret. It is forgotten once its dialog has closed.
  const [secretOpen, setSecretOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState("")
  const [copied, setCopied] = useState(false)

  // Edit and revoke. Each target outlives its dialog being open, so that
  // the dialog still shows it while it animates out.
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ApiKey | null>(null)
  const [editName, setEditName] = useState("")
  const [editScopes, setEditScopes] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Signing in again
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingAction, setPendingAction] =
    useState<PendingApiKeyAction | null>(null)

  const catalog =
    scopeCatalog.status === "ready" ? scopeCatalog.data : undefined
  const chosenScopes = createScopes ?? getDefaultScopes(catalog?.presets ?? [])
  // A new key needs a scope; an old key without any may still be renamed,
  // but a choice cannot be cleared down to nothing.
  const createBlocked = !catalog || chosenScopes.length === 0
  const editScopesChanged =
    editTarget !== null && !hasSameScopes(editScopes, editTarget.scopes)
  const editBlocked = editScopesChanged && editScopes.length === 0

  const all = keys.status === "ready" ? keys.data : []
  const rows: Row[] = all.map((key) => ({ key, status: getStatus(key) }))
  // With no sort chosen the server's order stands.
  const ordered = sortRows(rows, sort, SORTERS)
  const sortBy = (key: SortKey) => setSort((current) => nextSort(current, key))

  function showSecret(secret: string) {
    setCreatedSecret(secret)
    setCopied(false)
    setSecretOpen(true)
  }

  function handleRecentAuthRequired(action: PendingApiKeyAction) {
    setPendingAction(action)
    setCreateOpen(false)
    setEditOpen(false)
    setRevokeOpen(false)
    setReauthOpen(true)
  }

  function handleReauthOpenChange(open: boolean) {
    if (!open) {
      setPendingAction(null)
    }
    setReauthOpen(open)
  }

  /**
   * Sends a change and says how it went, closing its dialog once it is done.
   * One refused for want of a recent sign-in waits for the password and then
   * runs again by itself (`isReplay`); refused again then, it has failed.
   */
  async function perform(action: PendingApiKeyAction, isReplay = false) {
    try {
      if (action.type === "create") {
        const result = await onCreate(action.input)
        setCreateName("")
        setCreateExpiresAt("")
        setCreateScopes(null)
        setCreateOpen(false)
        showSecret(result.key)
      } else if (action.type === "update") {
        await onUpdate(action.id, action.input)
        setEditOpen(false)
      } else {
        await onRevoke(action.id)
        setRevokeOpen(false)
      }
      toast.success(t(`${action.type}Success`))
    } catch (error) {
      if (!isReplay && isRecentAuthError(error)) {
        handleRecentAuthRequired(action)
        return
      }
      toast.error(t(`${action.type}Failed`))
    }
  }

  async function handleReauthVerified() {
    if (pendingAction) {
      await perform(pendingAction, true)
      setPendingAction(null)
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
    if (createBlocked) return
    const input: CreateApiKeyInput = {
      name: createName.trim(),
      expires_at: createExpiresAt
        ? new Date(createExpiresAt).toISOString()
        : null,
      scopes: chosenScopes
    }

    setCreating(true)
    await perform({ type: "create", input })
    setCreating(false)
  }

  function startEdit(key: ApiKey) {
    setEditTarget(key)
    setEditName(key.name)
    setEditScopes(key.scopes)
    setEditOpen(true)
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTarget || editBlocked) return
    // Scopes are only sent when they changed, as on the current page.
    const input: UpdateApiKeyInput = {
      name: editName.trim(),
      ...(editScopesChanged ? { scopes: editScopes } : {})
    }

    setEditing(true)
    await perform({ type: "update", id: editTarget.id, input })
    setEditing(false)
  }

  function startRevoke(key: ApiKey) {
    setRevokeTarget(key)
    setRevokeOpen(true)
  }

  async function confirmRevoke() {
    if (!revokeTarget) return

    setRevoking(true)
    await perform({ type: "revoke", id: revokeTarget.id })
    setRevoking(false)
  }

  async function copySecret() {
    await navigator.clipboard.writeText(createdSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rowProps = (row: Row): RowActionsProps => ({
    row,
    catalog,
    onEdit: startEdit,
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
                    <Table.Head>{t("scopes")}</Table.Head>
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
        <Dialog
          size="lg"
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-6 py-5"
        >
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

            <ScopePicker
              idPrefix="create-api-key"
              catalog={scopeCatalog}
              onRetry={onRetryScopes}
              value={chosenScopes}
              onChange={setCreateScopes}
              disabled={creating}
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
                disabled={creating || createBlocked}
                loading={creating}
                aria-describedby={
                  catalog && chosenScopes.length === 0
                    ? scopesHintId("create-api-key")
                    : undefined
                }
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

      {/* Edit a key */}
      <Dialog.Root
        open={editOpen}
        onOpenChange={(open) => {
          if (!open && !editing) setEditOpen(false)
        }}
      >
        <Dialog
          size="lg"
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-6 py-5"
        >
          <form onSubmit={submitEdit} className="grid grid-cols-1 gap-5">
            <div className="grid gap-1.5">
              <Dialog.Title className="text-lg font-semibold">
                {COPY.editTitle}
              </Dialog.Title>
              <Dialog.Description className="text-kumo-subtle">
                {t("editDescription")}
              </Dialog.Description>
            </div>

            <Input
              id="edit-api-key"
              label={t("name")}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={100}
              autoComplete="off"
              passwordManagerIgnore
              required
            />

            <ScopePicker
              // Remounted per key, so the scope list opens afresh for each.
              key={editTarget?.id}
              idPrefix="edit-api-key"
              catalog={scopeCatalog}
              onRetry={onRetryScopes}
              value={editScopes}
              onChange={setEditScopes}
              disabled={editing}
              requireOne={editScopesChanged}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditOpen(false)}
                disabled={editing}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={editing || editBlocked}
                loading={editing}
                aria-describedby={
                  editBlocked ? scopesHintId("edit-api-key") : undefined
                }
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
