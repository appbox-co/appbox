import { apiDelete, apiGet, apiPost } from "@/api/client"
import {
  createPasskey,
  PasskeyAlreadyRegistered,
  PasskeyCancelled,
  passkeysSupported
} from "../auth/webauthn"

/** A passkey as `GET /v1/users/passkeys` lists it. */
export interface Passkey {
  id: number
  name: string
  created_at: string
  last_used_at: string | null
  /** Synced to the person's other devices by their password manager. */
  backed_up: boolean
  /** Which password manager or device made it, when it says. */
  aaguid: string | null
}

export type AddPasskeyResult =
  | { kind: "added"; passkey: Passkey }
  | { kind: "cancelled" }
  | { kind: "exists" }

/**
 * What the passkeys panel asks for. Live pages pass `livePasskeyActions`;
 * sample pages pass stand-ins that never open the browser's passkey prompt.
 * Adding and removing may throw the API's "recent authentication is
 * required" error, which the panel answers by asking for the password.
 */
export interface PasskeyActions {
  list: () => Promise<Passkey[]>
  add: () => Promise<AddPasskeyResult>
  rename: (id: number, name: string) => Promise<Passkey>
  remove: (id: number) => Promise<void>
}

/** The API's limit per account. */
export const MAX_PASSKEYS = 10

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

export function passkeyProvider(aaguid: string | null) {
  return aaguid ? PROVIDERS[aaguid.toLowerCase()] : undefined
}

/* -------------------------------------------------------------------------- */
/*  Live requests                                                              */
/* -------------------------------------------------------------------------- */

interface PasskeyChallenge {
  options: Record<string, unknown>
  challenge_token: string
}

export const livePasskeyActions: PasskeyActions = {
  list: async () =>
    (await apiGet<{ passkeys: Passkey[] }>("users/passkeys")).passkeys,

  add: async () => {
    if (!passkeysSupported()) {
      throw new Error("This browser cannot create passkeys.")
    }
    const { options, challenge_token } = await apiPost<PasskeyChallenge>(
      "users/passkeys/registration/options",
      {}
    )
    try {
      const credential = await createPasskey(options)
      const { passkey } = await apiPost<{ passkey: Passkey }>(
        "users/passkeys/registration",
        { challenge_token, credential }
      )
      return { kind: "added", passkey }
    } catch (error) {
      if (error instanceof PasskeyCancelled) return { kind: "cancelled" }
      if (error instanceof PasskeyAlreadyRegistered) return { kind: "exists" }
      throw error
    }
  },

  // POST, not PATCH: the production proxy only lets GET, POST, PUT and
  // DELETE through, as for renaming API keys.
  rename: async (id, name) =>
    (await apiPost<{ passkey: Passkey }>(`users/passkeys/${id}`, { name }))
      .passkey,

  remove: async (id) => {
    await apiDelete(`users/passkeys/${id}`)
  }
}
