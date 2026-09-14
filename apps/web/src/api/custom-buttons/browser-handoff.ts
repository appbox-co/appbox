import { apiPost } from "@/api/client"

export interface BrowserHandoffAdmission {
  execution_id: string
  status: "pending"
  pollRoute: string
  origin: string
}

const FAILURE = "Could not open OpenClaw. Return to Appbox and try again."

export function validateHandoffAdmission(
  value: unknown,
  actionRoute: string
): BrowserHandoffAdmission {
  const instanceId = /^buttons\/action\/\d+\/(\d+)$/.exec(actionRoute)?.[1]
  const item = value as BrowserHandoffAdmission | undefined
  if (
    !instanceId ||
    !item ||
    !/^[a-f0-9]{64}$/.test(item.execution_id) ||
    item.status !== "pending" ||
    item.pollRoute !== `buttons/handoff/${instanceId}/${item.execution_id}` ||
    typeof item.origin !== "string" ||
    !/^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      item.origin
    )
  ) {
    throw new Error(FAILURE)
  }
  return {
    execution_id: item.execution_id,
    status: "pending",
    pollRoute: item.pollRoute,
    origin: item.origin
  }
}

export function validateHandoffSecret(value: unknown, origin: string): string {
  const item = value as { url?: unknown; expiresAtMs?: unknown } | undefined
  if (
    !item ||
    typeof item.url !== "string" ||
    !Number.isSafeInteger(item.expiresAtMs) ||
    (item.expiresAtMs as number) <= Date.now() ||
    (item.expiresAtMs as number) > Date.now() + 630_000
  )
    throw new Error(FAILURE)
  let url: URL
  try {
    url = new URL(item.url)
  } catch {
    throw new Error(FAILURE)
  }
  if (
    url.protocol !== "https:" ||
    url.origin !== origin ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    !/^#bootstrapToken=[A-Za-z0-9_-]{32,256}&bootstrapProfile=owner$/.test(
      url.hash
    )
  )
    throw new Error(FAILURE)
  return url.href
}

/** Call synchronously from the confirmation click, before any request. */
export function openHandoffWindow(): Window {
  const popup = window.open("about:blank", "_blank")
  if (!popup) throw new Error("Allow pop-ups for Appbox, then try again.")
  popup.opener = null
  popup.document.title = "Opening OpenClaw"
  const policy = popup.document.createElement("meta")
  policy.name = "referrer"
  policy.content = "no-referrer"
  popup.document.head.append(policy)
  popup.document.body.textContent = "Preparing your secure OpenClaw dashboard…"
  return popup
}

export function failHandoffWindow(popup: Window): void {
  try {
    if (!popup.closed && popup.location.href === "about:blank") {
      popup.document.body.textContent = FAILURE
    }
  } catch {
    /* The user may have navigated or closed this tab. */
  }
}

/** Secret stays in this stack only: no React Query cache, storage or telemetry. */
export async function finishBrowserHandoff(
  popup: Window,
  admission: BrowserHandoffAdmission
): Promise<void> {
  const deadline = Date.now() + 180_000
  try {
    while (Date.now() < deadline) {
      if (popup.closed || popup.location.href !== "about:blank") return
      const result = await apiPost<{ status: string; secret?: unknown }>(
        admission.pollRoute,
        undefined,
        { cache: "no-store", signal: AbortSignal.timeout(15_000) }
      )
      if (popup.closed || popup.location.href !== "about:blank") return
      if (result?.status === "ready") {
        popup.location.replace(
          validateHandoffSecret(result.secret, admission.origin)
        )
        return
      }
      if (result?.status !== "pending") throw new Error(FAILURE)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    throw new Error(FAILURE)
  } catch {
    failHandoffWindow(popup)
    // Never show a transport error that might contain the response body.
    throw new Error(FAILURE)
  }
}
