import type { Reauth } from "../../_components/account/recent-auth"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Stand-in for signing in again on sample pages. Nothing typed is sent
 * anywhere or kept. It walks through both steps so the whole dialog can be
 * seen: any password is accepted except "wrong", then any code is accepted
 * except one of all zeros.
 */
export const sampleReauth: Reauth = async (request) => {
  await wait(600)

  if ("password" in request) {
    if (request.password === "wrong") {
      return { ok: false, error: "Sample: that password was not accepted." }
    }
    return { ok: true, two_factor_required: true, two_factor_token: "sample" }
  }

  if (/^0+$/.test(request.code)) {
    return { ok: false, error: "Sample: that code was not accepted." }
  }
  return { ok: true }
}
