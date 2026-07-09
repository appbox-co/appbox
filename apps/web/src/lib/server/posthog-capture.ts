import "server-only"

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com"
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

type CaptureProperties = Record<
  string,
  string | number | boolean | null | undefined
>

export async function captureServerEvent({
  event,
  distinctId,
  properties = {}
}: {
  event: string
  distinctId: string
  properties?: CaptureProperties
}) {
  if (!POSTHOG_KEY) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    await fetch(`${POSTHOG_HOST.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties
      }),
      cache: "no-store",
      signal: controller.signal
    })
  } catch {
    // Attribution capture must never block rendering or checkout redirects.
  } finally {
    clearTimeout(timeout)
  }
}
