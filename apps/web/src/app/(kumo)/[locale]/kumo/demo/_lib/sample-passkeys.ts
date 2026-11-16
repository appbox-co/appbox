import { ApiError } from "@/api/client"
import type {
  Passkey,
  PasskeyActions
} from "../../_components/account/passkeys"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Two made-up passkeys: one synced by Apple Passwords, one on a Windows PC. */
export const SAMPLE_PASSKEYS: Passkey[] = [
  {
    id: 1,
    name: "MacBook Pro",
    created_at: "2026-09-12T09:30:00Z",
    last_used_at: "2026-11-14T08:12:00Z",
    backed_up: true,
    aaguid: "fbfc3007-154e-4ecc-8c0b-6e020557d7bd"
  },
  {
    id: 2,
    name: "Office PC",
    created_at: "2026-10-03T14:05:00Z",
    last_used_at: null,
    backed_up: false,
    aaguid: "08987058-cadc-4b81-b6e1-30de50dcbe96"
  }
]

/**
 * Stand-ins for the passkeys panel on sample pages. They never open the
 * browser's passkey prompt: "adding" one makes up a Google Password Manager
 * passkey. Adding and removing answer with the API's recent-sign-in error
 * until `markSignedIn` is called, as the sample's sign-in dialog does.
 */
export function samplePasskeyActions(
  initial: Passkey[],
  signedInRecently: boolean
) {
  let passkeys = [...initial]
  let nextId = 100
  let recent = signedInRecently
  const guard = () => {
    if (!recent) {
      throw new ApiError(403, "Forbidden", "Recent authentication is required")
    }
  }

  const actions: PasskeyActions = {
    list: async () => {
      await wait(500)
      return [...passkeys]
    },
    add: async () => {
      await wait(300)
      guard()
      await wait(700)
      const passkey: Passkey = {
        id: nextId++,
        name: "Passkey",
        created_at: new Date().toISOString(),
        last_used_at: null,
        backed_up: true,
        aaguid: "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4"
      }
      passkeys = [passkey, ...passkeys]
      return { kind: "added", passkey }
    },
    rename: async (id, name) => {
      await wait(500)
      passkeys = passkeys.map((item) =>
        item.id === id ? { ...item, name } : item
      )
      return passkeys.find((item) => item.id === id)!
    },
    remove: async (id) => {
      await wait(500)
      guard()
      passkeys = passkeys.filter((item) => item.id !== id)
    }
  }

  return {
    actions,
    markSignedIn: () => {
      recent = true
    }
  }
}
