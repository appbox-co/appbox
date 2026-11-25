import type {
  Reauth,
  ReauthResult
} from "../../_components/account/recent-auth"

/**
 * Signs in again through the app's own route, exactly as the current design's
 * recent-auth dialog does: it sends what was typed, with the browser's cookies.
 */
export const postReauth: Reauth = async (request) => {
  const response = await fetch("/api/auth/reauth", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(request)
  })

  const data = (await response.json().catch(() => ({}))) as Omit<
    ReauthResult,
    "ok"
  >
  return { ...data, ok: response.ok }
}
