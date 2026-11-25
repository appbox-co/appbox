"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useLocale } from "next-intl"
import { Badge, Banner, Button, Dialog, Input, Loader } from "@cloudflare/kumo"
import {
  FingerprintSimpleIcon,
  PlusIcon,
  WarningCircleIcon
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { isRecentAuthError, type Reauth } from "@/api/account/reauth"
import { Panel } from "../panel"
import {
  livePasskeyActions,
  MAX_PASSKEYS,
  passkeyProvider,
  type Passkey
} from "./passkeys"
import { RecentAuthDialog } from "./recent-auth-dialog"

/** Prototype-only copy, in English, as on the rest of the two-factor page. */
const COPY = {
  title: "Passkeys",
  intro:
    "Sign in with your fingerprint, face or device PIN instead of your password. A passkey also skips the two-factor step, because it already proves you hold the device.",
  add: "Add a passkey",
  empty: "No passkeys yet.",
  loadFailed: "Your passkeys could not be loaded.",
  retry: "Try again",
  limit: `You have the most passkeys an account can hold (${MAX_PASSKEYS}). Remove one to add another.`,
  added: "Passkey added",
  exists: "This device already has a passkey for your account.",
  addFailed: "The passkey could not be added.",
  synced: "Synced",
  added_on: (date: string) => `Added ${date}`,
  last_used: (date: string) => `last used ${date}`,
  never_used: "never used",
  rename: "Rename",
  remove: "Remove",
  nameTitle: "Name your passkey",
  renameTitle: "Rename passkey",
  nameHint: "So you can tell it apart from your others later.",
  nameLabel: "Name",
  save: "Save",
  skip: "Skip",
  cancel: "Cancel",
  renameFailed: "The passkey could not be renamed.",
  removeTitle: "Remove passkey?",
  removeBody: (name: string) =>
    `You will no longer be able to sign in with “${name}”. Your password still works.`,
  removed: "Passkey removed",
  removeFailed: "The passkey could not be removed.",
  reauth:
    "Changing your passkeys needs a recent sign-in. Enter your password to continue."
} as const

type Pending = { kind: "add" } | { kind: "remove"; passkey: Passkey }

function useShortDate() {
  const locale = useLocale()
  return (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
}

function PasskeyRow({
  passkey,
  onRename,
  onRemove
}: {
  passkey: Passkey
  onRename: () => void
  onRemove: () => void
}) {
  const shortDate = useShortDate()
  const provider = passkeyProvider(passkey.aaguid)

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kumo-tint text-kumo-subtle ring ring-kumo-hairline">
        <FingerprintSimpleIcon size={20} aria-hidden="true" />
      </span>
      {/* Narrow rows put the buttons on a line of their own. */}
      <div className="grid min-w-48 flex-1 gap-0.5">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-medium">{passkey.name}</span>
          {passkey.backed_up && (
            <Badge variant="secondary">{COPY.synced}</Badge>
          )}
        </span>
        <span className="text-kumo-subtle" suppressHydrationWarning>
          {[
            provider,
            COPY.added_on(shortDate(passkey.created_at)),
            passkey.last_used_at
              ? COPY.last_used(shortDate(passkey.last_used_at))
              : COPY.never_used
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <span className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={onRename}>
          {COPY.rename}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          {COPY.remove}
        </Button>
      </span>
    </li>
  )
}

/**
 * The account's passkeys: add one (the browser makes it), name it, remove it.
 * Adding and removing need a recent sign-in; when the API asks for one, the
 * password is asked for and the change is tried again.
 */
export function PasskeysPanel({ reauth }: { reauth: Reauth }) {
  const [passkeys, setPasskeys] = useState<Passkey[]>()
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadRun, setLoadRun] = useState(0)
  const [adding, setAdding] = useState(false)

  // Naming: straight after adding one, or from its Rename button.
  const [naming, setNaming] = useState<{ passkey: Passkey; fresh: boolean }>()
  const [nameOpen, setNameOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const [removing, setRemoving] = useState<Passkey>()
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removePending, setRemovePending] = useState(false)

  // What to try again once the password has been entered.
  const [retry, setRetry] = useState<Pending>()
  const [reauthOpen, setReauthOpen] = useState(false)

  useEffect(() => {
    let current = true
    livePasskeyActions
      .list()
      .then((result) => {
        if (!current) return
        setPasskeys(result)
        setLoadFailed(false)
      })
      .catch(() => {
        if (current) setLoadFailed(true)
      })
    return () => {
      current = false
    }
  }, [loadRun])

  const askToName = (passkey: Passkey, fresh: boolean) => {
    setNaming({ passkey, fresh })
    setName(
      fresh ? (passkeyProvider(passkey.aaguid) ?? passkey.name) : passkey.name
    )
    setNameOpen(true)
  }

  const add = async ({ afterReauth = false } = {}) => {
    setAdding(true)
    try {
      const result = await livePasskeyActions.add()
      if (result.kind === "cancelled") return
      if (result.kind === "exists") {
        toast.error(COPY.exists)
        return
      }
      setPasskeys((current) => [result.passkey, ...(current ?? [])])
      toast.success(COPY.added)
      askToName(result.passkey, true)
    } catch (error) {
      if (isRecentAuthError(error)) {
        // Refused again straight after signing in: let the dialog say so.
        if (afterReauth) throw error
        setRetry({ kind: "add" })
        setReauthOpen(true)
        return
      }
      toast.error(
        error instanceof Error && error.message ? error.message : COPY.addFailed
      )
    } finally {
      setAdding(false)
    }
  }

  const remove = async (passkey: Passkey, { afterReauth = false } = {}) => {
    setRemovePending(true)
    try {
      await livePasskeyActions.remove(passkey.id)
      setPasskeys((current) =>
        current?.filter((item) => item.id !== passkey.id)
      )
      setRemoveOpen(false)
      toast.success(COPY.removed)
    } catch (error) {
      if (isRecentAuthError(error)) {
        if (afterReauth) throw error
        setRemoveOpen(false)
        setRetry({ kind: "remove", passkey })
        setReauthOpen(true)
        return
      }
      toast.error(COPY.removeFailed)
    } finally {
      setRemovePending(false)
    }
  }

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!naming || saving) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === naming.passkey.name) {
      setNameOpen(false)
      return
    }
    setSaving(true)
    try {
      const updated = await livePasskeyActions.rename(
        naming.passkey.id,
        trimmed
      )
      setPasskeys((current) =>
        current?.map((item) => (item.id === updated.id ? updated : item))
      )
      setNameOpen(false)
    } catch {
      toast.error(COPY.renameFailed)
    } finally {
      setSaving(false)
    }
  }

  const full = (passkeys?.length ?? 0) >= MAX_PASSKEYS

  return (
    <Panel
      title={COPY.title}
      count={passkeys?.length || undefined}
      flush
      action={
        <Button
          size="sm"
          icon={PlusIcon}
          onClick={() => void add()}
          loading={adding}
          disabled={adding || !passkeys || full}
        >
          {COPY.add}
        </Button>
      }
    >
      <div className="grid grid-cols-1 divide-y divide-kumo-hairline">
        <div className="px-5 py-4">
          <p className="max-w-prose text-kumo-subtle">{COPY.intro}</p>
        </div>

        {loadFailed && (
          <div className="grid justify-items-start gap-3 px-5 py-4">
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              description={COPY.loadFailed}
            />
            <Button size="sm" onClick={() => setLoadRun((run) => run + 1)}>
              {COPY.retry}
            </Button>
          </div>
        )}

        {!passkeys && !loadFailed && (
          <div className="flex justify-center px-5 py-6">
            <Loader />
          </div>
        )}

        {passkeys?.length === 0 && (
          <p className="px-5 py-4 text-kumo-subtle">{COPY.empty}</p>
        )}

        {passkeys && passkeys.length > 0 && (
          <ul className="grid grid-cols-1 divide-y divide-kumo-hairline">
            {passkeys.map((passkey) => (
              <PasskeyRow
                key={passkey.id}
                passkey={passkey}
                onRename={() => askToName(passkey, false)}
                onRemove={() => {
                  setRemoving(passkey)
                  setRemoveOpen(true)
                }}
              />
            ))}
          </ul>
        )}

        {full && <p className="px-5 py-4 text-kumo-subtle">{COPY.limit}</p>}
      </div>

      <Dialog.Root
        open={nameOpen}
        onOpenChange={(open) => {
          if (!open && !saving) setNameOpen(false)
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {naming?.fresh ? COPY.nameTitle : COPY.renameTitle}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {COPY.nameHint}
            </Dialog.Description>
          </div>
          <form onSubmit={saveName} className="grid grid-cols-1 gap-5">
            <Input
              id="passkey-name"
              label={COPY.nameLabel}
              value={name}
              maxLength={64}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setNameOpen(false)}
                disabled={saving}
              >
                {naming?.fresh ? COPY.skip : COPY.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving}
              >
                {COPY.save}
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root
        role="alertdialog"
        open={removeOpen}
        onOpenChange={(open) => {
          if (!open && !removePending) setRemoveOpen(false)
        }}
      >
        <Dialog className="grid grid-cols-1 gap-5 px-6 py-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {COPY.removeTitle}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {removing && COPY.removeBody(removing.name)}
            </Dialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setRemoveOpen(false)}
              disabled={removePending}
            >
              {COPY.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => removing && void remove(removing)}
              loading={removePending}
              disabled={removePending}
            >
              {COPY.remove}
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>

      <RecentAuthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onVerified={async () => {
          const action = retry
          setRetry(undefined)
          if (action?.kind === "add") await add({ afterReauth: true })
          if (action?.kind === "remove") {
            await remove(action.passkey, { afterReauth: true })
          }
        }}
        reauth={reauth}
        description={COPY.reauth}
        idPrefix="passkeys-reauth"
      />
    </Panel>
  )
}
