import type { QueryClient, QueryKey } from "@tanstack/react-query"

// Fallback re-sends of a ws-gateway range request (each one costs the host an
// immediate stats fetch), starting after its usual ~3 s response time.
const RETRY_DELAYS_MS = [4000, 8000, 16000, 30000]

/**
 * Sends a range request now, then re-sends it with backoff until the query at
 * `queryKey` receives a push newer than the request. Older cached data for the
 * range doesn't count. The websocket provider replays the latest range request
 * when the socket opens, so the retries are only a fallback. Returns a cleanup
 * function for useEffect.
 */
export function requestRangeUntilFresh(
  queryClient: QueryClient,
  queryKey: QueryKey,
  send: () => void
): () => void {
  const requestedAt = Date.now()
  let attempt = 0
  let timer: number | undefined

  const scheduleRetry = () => {
    if (attempt >= RETRY_DELAYS_MS.length) return
    timer = window.setTimeout(() => {
      const updatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt ?? 0
      if (updatedAt > requestedAt) return
      attempt += 1
      send()
      scheduleRetry()
    }, RETRY_DELAYS_MS[attempt])
  }

  send()
  scheduleRetry()

  return () => window.clearTimeout(timer)
}
