import { apiDelete, apiGet, apiPost } from "@/api/client"

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

/** The API's limit per account. */
export const MAX_PASSKEYS = 10

type Json = Record<string, unknown>

/**
 * The browser's part of adding a passkey: given the API's options, it makes
 * the passkey and returns the credential to register.
 */
export type CreatePasskeyCredential = (options: Json) => Promise<Json>

interface PasskeyChallenge {
  options: Json
  challenge_token: string
}

/*
 * Adding and removing may fail with the API's "recent authentication is
 * required" error (see `isRecentAuthError` in ./reauth).
 */

export async function getPasskeys(): Promise<Passkey[]> {
  return (await apiGet<{ passkeys: Passkey[] }>("users/passkeys")).passkeys
}

/**
 * Gets a challenge from the API, has the browser answer it with a new
 * passkey, and registers that. Whatever `createCredential` throws (the person
 * closing the prompt, say) comes back out unchanged.
 */
export async function addPasskey(
  createCredential: CreatePasskeyCredential
): Promise<Passkey> {
  const { options, challenge_token } = await apiPost<PasskeyChallenge>(
    "users/passkeys/registration/options",
    {}
  )
  const credential = await createCredential(options)
  const { passkey } = await apiPost<{ passkey: Passkey }>(
    "users/passkeys/registration",
    { challenge_token, credential }
  )
  return passkey
}

// POST, not PATCH: the production proxy only lets GET, POST, PUT and DELETE
// through, as for renaming API keys.
export async function renamePasskey(id: number, name: string) {
  return (await apiPost<{ passkey: Passkey }>(`users/passkeys/${id}`, { name }))
    .passkey
}

export async function deletePasskey(id: number): Promise<void> {
  await apiDelete(`users/passkeys/${id}`)
}
