/*
 * The browser's side of passkeys. The API speaks the standard WebAuthn JSON
 * form (base64url strings); browsers that lack the built-in converters
 * (Safari before 18.4) get the same conversion done here.
 */

/** Passed through untouched: the API's options, the browser's credential. */
type Json = Record<string, unknown>

/** The person closed the prompt, or it timed out. Not an error to show. */
export class PasskeyCancelled extends Error {
  constructor() {
    super("Passkey prompt closed")
    this.name = "PasskeyCancelled"
  }
}

/** Registration refused: this device already holds a passkey for the account. */
export class PasskeyAlreadyRegistered extends Error {
  constructor() {
    super("This device already has a passkey for your account.")
    this.name = "PasskeyAlreadyRegistered"
  }
}

export function passkeysSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential === "function" &&
    typeof navigator.credentials?.get === "function"
  )
}

/** Whether passkeys can be offered in the email field's autofill list. */
export async function passkeyAutofillAvailable() {
  if (!passkeysSupported()) return false
  try {
    return (
      (await PublicKeyCredential.isConditionalMediationAvailable?.()) ?? false
    )
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/*  base64url, for browsers without the built-in converters                    */
/* -------------------------------------------------------------------------- */

function toBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  )
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  return bytes.buffer
}

function fromBuffer(
  buffer: ArrayBuffer | null | undefined
): string | undefined {
  if (!buffer) return undefined
  let binary = ""
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

type Descriptor = { id: string; type: string; transports?: string[] }

function descriptors(list: unknown) {
  return ((list as Descriptor[] | undefined) ?? []).map((item) => ({
    ...item,
    id: toBuffer(item.id)
  })) as PublicKeyCredentialDescriptor[]
}

function requestOptions(options: Json): PublicKeyCredentialRequestOptions {
  if (typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
    return PublicKeyCredential.parseRequestOptionsFromJSON(
      options as unknown as PublicKeyCredentialRequestOptionsJSON
    )
  }
  return {
    ...(options as object),
    challenge: toBuffer(options.challenge as string),
    allowCredentials: descriptors(options.allowCredentials)
  } as PublicKeyCredentialRequestOptions
}

function creationOptions(options: Json): PublicKeyCredentialCreationOptions {
  if (typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
    return PublicKeyCredential.parseCreationOptionsFromJSON(
      options as unknown as PublicKeyCredentialCreationOptionsJSON
    )
  }
  const user = options.user as { id: string; name: string; displayName: string }
  return {
    ...(options as object),
    challenge: toBuffer(options.challenge as string),
    user: { ...user, id: toBuffer(user.id) },
    excludeCredentials: descriptors(options.excludeCredentials)
  } as PublicKeyCredentialCreationOptions
}

/** `credential.toJSON()`, written out for browsers that lack it. */
function credentialJson(credential: PublicKeyCredential): Json {
  if (typeof credential.toJSON === "function") {
    return credential.toJSON() as Json
  }
  const response = credential.response
  const base = {
    id: credential.id,
    rawId: fromBuffer(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    clientExtensionResults: credential.getClientExtensionResults()
  }
  if ("attestationObject" in response) {
    const attestation = response as AuthenticatorAttestationResponse
    return {
      ...base,
      response: {
        clientDataJSON: fromBuffer(attestation.clientDataJSON),
        attestationObject: fromBuffer(attestation.attestationObject),
        transports: attestation.getTransports?.() ?? []
      }
    }
  }
  const assertion = response as AuthenticatorAssertionResponse
  return {
    ...base,
    response: {
      clientDataJSON: fromBuffer(assertion.clientDataJSON),
      authenticatorData: fromBuffer(assertion.authenticatorData),
      signature: fromBuffer(assertion.signature),
      userHandle: fromBuffer(assertion.userHandle)
    }
  }
}

/** NotAllowedError covers a closed prompt, a timeout and "no passkey here". */
function isCancel(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "AbortError")
  )
}

/* -------------------------------------------------------------------------- */
/*  Ceremonies                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Asks for a passkey and returns it as JSON. `conditional` waits quietly
 * behind the email field's autofill list until one is picked there.
 */
export async function getPasskey(
  options: Json,
  {
    conditional = false,
    signal
  }: { conditional?: boolean; signal?: AbortSignal } = {}
): Promise<Json> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: requestOptions(options),
      ...(conditional
        ? { mediation: "conditional" as CredentialMediationRequirement }
        : {}),
      signal
    })
    if (!credential) throw new PasskeyCancelled()
    return credentialJson(credential as PublicKeyCredential)
  } catch (error) {
    if (isCancel(error)) throw new PasskeyCancelled()
    throw error
  }
}

/** Makes a passkey for the signed-in account and returns it as JSON. */
export async function createPasskey(options: Json): Promise<Json> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: creationOptions(options)
    })
    if (!credential) throw new PasskeyCancelled()
    return credentialJson(credential as PublicKeyCredential)
  } catch (error) {
    if (isCancel(error)) throw new PasskeyCancelled()
    // The API lists the account's passkeys as ones to exclude.
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      throw new PasskeyAlreadyRegistered()
    }
    throw error
  }
}
