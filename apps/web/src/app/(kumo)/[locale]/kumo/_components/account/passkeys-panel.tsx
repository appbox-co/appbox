"use client"

import { useState, type FormEvent } from "react"
import { useLocale } from "next-intl"
import { Badge, Banner, Button, Dialog, Input, Loader } from "@cloudflare/kumo"
import {
  FingerprintSimpleIcon,
  PlusIcon,
  WarningCircleIcon
} from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  useAddPasskey,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey
} from "@/api/account/hooks/use-passkeys"
import { MAX_PASSKEYS, type Passkey } from "@/api/account/passkeys"
import { isRecentAuthError } from "@/api/account/reauth"
import {
  createPasskey,
  PasskeyAlreadyRegistered,
  PasskeyCancelled,
  passkeysSupported
} from "../auth/webauthn"
import { Panel } from "../ui/panel"
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
  unsupported: "This browser cannot create passkeys.",
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

/**
 * Names for the password managers and devices most passkeys come from, from
 * the community list at github.com/passkeydeveloper/passkey-authenticator-aaguids.
 */
const PROVIDERS: Record<string, string> = {
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "Apple Passwords",
  "dd4ec289-e01d-41c9-bb89-70fa845d4bf2": "iCloud Keychain (Managed)",
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  "adce0002-35bc-c60a-648b-0b25f1f05503": "Chrome on Mac",
  "771b48fd-d3d4-4f74-9232-fc157ab0507a": "Edge on Mac",
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
  "b84e4048-15dc-4dd0-8640-f4f60813c8af": "NordPass",
  "0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6": "Keeper",
  "f3809540-7f14-49c1-a8b3-8f813b225541": "Enpass",
  "b78a0a55-6ef8-d246-a042-ba0f6d55050c": "LastPass",
  "53414d53-554e-4700-0000-000000000000": "Samsung Pass",
  "50726f74-6f6e-5061-7373-50726f746f6e": "Proton Pass",
  "fdb141b2-5d84-443e-8a35-4698c205a502": "KeePassXC"
}

function passkeyProvider(aaguid: string | null) {
  return aaguid ? PROVIDERS[aaguid.toLowerCase()] : undefined
}

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
export function PasskeysPanel() {
  const passkeysQuery = usePasskeys()
  const addPasskey = useAddPasskey()
  const renamePasskey = useRenamePasskey()
  const deletePasskey = useDeletePasskey()

  const passkeys = passkeysQuery.data
  // A failed refresh keeps a list already on screen.
  const loadFailed = passkeysQuery.isError && !passkeys
  const adding = addPasskey.isPending

  // Naming: straight after adding one, or from its Rename button.
  const [naming, setNaming] = useState<{ passkey: Passkey; fresh: boolean }>()
  const [nameOpen, setNameOpen] = useState(false)
  const [name, setName] = useState("")
  const saving = renamePasskey.isPending

  const [removing, setRemoving] = useState<Passkey>()
  const [removeOpen, setRemoveOpen] = useState(false)
  const removePending = deletePasskey.isPending

  // What to try again once the password has been entered.
  const [retry, setRetry] = useState<Pending>()
  const [reauthOpen, setReauthOpen] = useState(false)

  const askToName = (passkey: Passkey, fresh: boolean) => {
    setNaming({ passkey, fresh })
    setName(
      fresh ? (passkeyProvider(passkey.aaguid) ?? passkey.name) : passkey.name
    )
    setNameOpen(true)
  }

  const add = async ({ afterReauth = false } = {}) => {
    if (!passkeysSupported()) {
      toast.error(COPY.unsupported)
      return
    }
    try {
      const passkey = await addPasskey.mutateAsync(createPasskey)
      toast.success(COPY.added)
      askToName(passkey, true)
    } catch (error) {
      // Closing the browser's prompt is not an error.
      if (error instanceof PasskeyCancelled) return
      if (error instanceof PasskeyAlreadyRegistered) {
        toast.error(COPY.exists)
        return
      }
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
    }
  }

  const remove = async (passkey: Passkey, { afterReauth = false } = {}) => {
    try {
      await deletePasskey.mutateAsync(passkey.id)
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
    try {
      await renamePasskey.mutateAsync({ id: naming.passkey.id, name: trimmed })
      setNameOpen(false)
    } catch {
      toast.error(COPY.renameFailed)
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
            <Button size="sm" onClick={() => void passkeysQuery.refetch()}>
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
        description={COPY.reauth}
        idPrefix="passkeys-reauth"
      />
    </Panel>
  )
}
