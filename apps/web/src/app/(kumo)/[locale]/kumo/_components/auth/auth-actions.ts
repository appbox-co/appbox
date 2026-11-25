import { ApiError, apiPost } from "@/api/client"
import { getSafeAuthRedirect } from "@/lib/auth/safe-redirect"
import { getPasskey, PasskeyCancelled } from "./webauthn"

/*
 * What the sign-in pages send, kept apart from what they render. The requests
 * are the current design's sign-in pages', unchanged.
 */

export type SignInResult =
  | { kind: "signed-in" }
  | { kind: "two-factor"; token: string }
  | { kind: "error"; message?: string }

export type TwoFactorResult =
  | { kind: "signed-in"; recoveryCodesExhausted: boolean }
  | { kind: "error"; message?: string }

/**
 * A passkey proves both who you are and that you hold the device, so it skips
 * the two-factor step. Closing the browser's passkey prompt is not an error.
 */
export type PasskeyResult =
  | { kind: "signed-in" }
  | { kind: "cancelled" }
  | { kind: "error"; message?: string }

export type RequestResult = { ok: true } | { ok: false; message?: string }

export interface SignInActions {
  signIn: (email: string, password: string) => Promise<SignInResult>
  verifyTwoFactor: (
    token: string,
    code: string,
    useRecovery: boolean
  ) => Promise<TwoFactorResult>
  /**
   * Runs the browser's passkey prompt and signs in with what it returns.
   * Left out, the button is hidden.
   */
  signInWithPasskey?: () => Promise<PasskeyResult>
  /**
   * Offers passkeys in the email field's autofill list and signs in with one
   * if it is picked there. Settles once that happens or `signal` aborts.
   */
  passkeyAutofill?: (signal: AbortSignal) => Promise<PasskeyResult>
  /** Goes to the page the person was heading for, now signed in. */
  finish: (destination: string) => void
}

/**
 * Where to go once signed in: the page asked for in `?redirect=` if it is a
 * safe same-site path, otherwise the prototype's home.
 */
export function signInDestination(redirect: string | null, home: string) {
  return redirect && getSafeAuthRedirect(redirect) === redirect
    ? redirect
    : home
}

/* -------------------------------------------------------------------------- */
/*  Requests                                                                   */
/* -------------------------------------------------------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined
  const obj = data as Record<string, unknown>
  if (typeof obj.error === "string" && obj.error) return obj.error
  if (typeof obj.message === "string" && obj.message) return obj.message
  return undefined
}

/** The API's error shape for the password reset endpoints. */
function extractApiError(data: {
  error?: string | { message?: string }
  message?: string
}): string | undefined {
  return (
    (typeof data.error === "string" ? data.error : data.error?.message) ||
    data.message ||
    undefined
  )
}

async function postLogin(
  email: string,
  password: string
): Promise<SignInResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()

  if (!res.ok) return { kind: "error", message: extractErrorMessage(data) }
  if (data.two_factor_required) {
    return { kind: "two-factor", token: data.two_factor_token || "" }
  }
  return { kind: "signed-in" }
}

async function postTwoFactor(
  token: string,
  code: string,
  useRecovery: boolean
): Promise<TwoFactorResult> {
  const res = await fetch("/api/auth/2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      two_factor_token: token,
      code,
      use_recovery: useRecovery
    })
  })
  const data = await res.json()

  if (!res.ok) return { kind: "error", message: extractErrorMessage(data) }
  return {
    kind: "signed-in",
    recoveryCodesExhausted: Boolean(data.recovery_codes_exhausted)
  }
}

/** Sends the reset link to `email`. */
export async function putForgot(email: string): Promise<RequestResult> {
  const res = await fetch(`${API_BASE_URL}/users/forgot`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ email })
  })
  const data = await res.json()

  return res.ok ? { ok: true } : { ok: false, message: extractApiError(data) }
}

/** Sets a new password with the token from the reset link. */
export async function postReset(
  token: string,
  password: string
): Promise<RequestResult> {
  const res = await fetch(`${API_BASE_URL}/users/forgot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ mail_token: token, password })
  })
  const data = await res.json()

  return res.ok ? { ok: true } : { ok: false, message: extractApiError(data) }
}

/**
 * Whether the pages offer passkeys. Off until the API from
 * appbox-co/cylo-api#221 is deployed with its migration; set
 * `NEXT_PUBLIC_PASSKEYS=on` to try it against an API that has them.
 */
export const LIVE_PASSKEYS =
  process.env.NEXT_PUBLIC_PASSKEYS === "on" ||
  // Staging (appbox.foo) runs the passkey API, so it is on there.
  process.env.NEXT_PUBLIC_DOMAIN === "appbox.foo"

interface PasskeyChallenge {
  options: Record<string, unknown>
  challenge_token: string
}

/**
 * Passkey sign-in goes straight to the API, not through a route handler as
 * the password does: the API limits passkey sign-ins per IP address, and
 * behind a route handler every visitor would share the web server's. The
 * API's answer sets the same session cookie itself.
 */
async function passkeySignIn(
  conditional: boolean,
  signal?: AbortSignal
): Promise<PasskeyResult> {
  let challenge: PasskeyChallenge
  try {
    challenge = await apiPost<PasskeyChallenge>(
      "users/authenticate/passkey/options",
      {}
    )
  } catch (error) {
    // Autofill is an offer, not something the person asked for: if the API
    // cannot start one, just make no offer (and do not ask again and again).
    if (conditional) return { kind: "cancelled" }
    if (error instanceof ApiError) {
      return { kind: "error", message: error.message }
    }
    throw error
  }

  try {
    const credential = await getPasskey(challenge.options, {
      conditional,
      signal
    })
    await apiPost("users/authenticate/passkey", {
      challenge_token: challenge.challenge_token,
      credential
    })
    return { kind: "signed-in" }
  } catch (error) {
    if (error instanceof PasskeyCancelled) return { kind: "cancelled" }
    if (error instanceof ApiError) {
      return { kind: "error", message: error.message }
    }
    throw error
  }
}

/**
 * Signing in sets the session cookie in a route handler, so the page after it
 * is a full load, as in the current design: the client router would otherwise
 * reuse the signed-out state.
 */
export function liveSignInActions(
  localise: (path: string) => string
): SignInActions {
  return {
    signIn: postLogin,
    verifyTwoFactor: postTwoFactor,
    ...(LIVE_PASSKEYS && {
      signInWithPasskey: () => passkeySignIn(false),
      passkeyAutofill: (signal: AbortSignal) => passkeySignIn(true, signal)
    }),
    finish: (destination) => window.location.replace(localise(destination))
  }
}
