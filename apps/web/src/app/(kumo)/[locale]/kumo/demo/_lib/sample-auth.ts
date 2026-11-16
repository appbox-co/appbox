import type {
  ForgotPasswordActions,
  RequestResult,
  ResetPasswordActions,
  SignInActions
} from "../../_components/auth/auth-actions"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/*
 * Stand-ins for the sign-in pages' requests on sample pages. None of them
 * takes what was typed, so nothing typed into a sample page is sent anywhere
 * or kept. Which answer comes back is the page's sample state.
 */

export type SampleSignIn = "straight" | "two-factor" | "refused" | "install"

/** Any code is accepted except one of all zeros, as in `sampleReauth`. */
export function sampleSignInActions(
  state: SampleSignIn,
  finish: (destination: string) => void
): SignInActions {
  return {
    signIn: async () => {
      await wait(600)
      if (state === "refused") {
        return {
          kind: "error",
          message: "Sample: that password was not accepted."
        }
      }
      if (state === "two-factor") return { kind: "two-factor", token: "sample" }
      return { kind: "signed-in" }
    },
    verifyTwoFactor: async (_token, code) => {
      await wait(600)
      if (/^0+$/.test(code)) {
        return { kind: "error", message: "Sample: that code was not accepted." }
      }
      return { kind: "signed-in", recoveryCodesExhausted: false }
    },
    // Never calls the browser's passkey prompt: there is no sample server to
    // answer it, and the prompt would offer the person's real passkeys.
    signInWithPasskey: async () => {
      await wait(900)
      if (state === "refused") {
        return {
          kind: "error",
          message: "Sample: that passkey was not recognised."
        }
      }
      return { kind: "signed-in" }
    },
    finish
  }
}

export type SampleRequest = "works" | "refused"

async function sampleRequest(state: SampleRequest): Promise<RequestResult> {
  await wait(600)
  return state === "refused"
    ? { ok: false, message: "Sample: the request was refused." }
    : { ok: true }
}

export function sampleForgotPasswordActions(
  state: SampleRequest
): ForgotPasswordActions {
  return { requestReset: () => sampleRequest(state) }
}

export function sampleResetPasswordActions(
  state: SampleRequest
): ResetPasswordActions {
  return { resetPassword: () => sampleRequest(state) }
}

export const SAMPLE_REQUEST_STATES = [
  { value: "works", label: "Request works" },
  { value: "refused", label: "Request is refused" }
] as const satisfies readonly { value: SampleRequest; label: string }[]
