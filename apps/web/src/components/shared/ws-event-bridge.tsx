"use client"

import { useEffect } from "react"
import { WS_EVENTS } from "@/constants/events"
import { useWsQueryInvalidation } from "@/lib/websocket/hooks"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/providers/websocket-provider"

/**
 * Invisible component that bridges WebSocket events to TanStack Query cache
 * and handles auth-level events such as forced session expiry.
 * Mount once in the dashboard layout.
 */
export function WsEventBridge() {
  const ws = useWebSocket()
  const { logout } = useAuth()
  useWsQueryInvalidation(ws)

  // Force-logout all connected sessions when the backend invalidates tokens
  // (e.g. after a password change). The PHP backend publishes this event via
  // pg_notify → user_events, which the ws-gateway fans out to every open
  // WebSocket connection for that user.
  useEffect(() => {
    return ws.on(WS_EVENTS.USER_SESSION_EXPIRED, () => {
      logout()
    })
  }, [ws, logout])

  return null
}
