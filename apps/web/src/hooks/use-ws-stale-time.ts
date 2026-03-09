"use client"

import { useWebSocket } from "@/providers/websocket-provider"

/**
 * Returns appropriate staleTime based on WebSocket connection health.
 * When WS is healthy: Infinity (only refetch on WS events)
 * When WS is degraded: 30s (poll fallback)
 * Must be used within WebSocket provider.
 */
export function useWsStaleTime(defaultMs: number = 30_000): number {
  const { isHealthy } = useWebSocket()
  return isHealthy ? Infinity : defaultMs
}
