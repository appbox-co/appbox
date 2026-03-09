"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { WsClient, type WsEventHandler } from "@/lib/websocket/client"
import type { WsMessage } from "@/lib/websocket/types"

interface WsContextValue {
  isConnected: boolean
  isHealthy: boolean
  centralClient: WsClient | null
  on: (event: string, handler: (msg: WsMessage) => void) => () => void
  onAny: (handler: (msg: WsMessage) => void) => () => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  connectToServer: (serverName: string) => void
  connectToServers: (serverNames: string[]) => void
  disconnectFromServer: (serverName?: string) => void
  sendToServer: (data: Record<string, unknown>, serverName?: string) => void
}

const WsContext = createContext<WsContextValue | null>(null)

export function useWebSocket() {
  const ctx = useContext(WsContext)
  if (!ctx) {
    throw new Error("useWebSocket must be used within WebSocketProvider")
  }
  return ctx
}

export function useOptionalWebSocket() {
  return useContext(WsContext)
}

interface WebSocketProviderProps {
  children: ReactNode
  wsEnabled?: boolean
}

export function WebSocketProvider({
  children,
  wsEnabled
}: WebSocketProviderProps) {
  const enabled = wsEnabled ?? process.env.NEXT_PUBLIC_WS_ENABLED !== "false"
  const queryClient = useQueryClient()
  const centralRef = useRef<WsClient | null>(null)

  // Pool of server connections keyed by server name
  const serverRefsMap = useRef<Map<string, WsClient>>(new Map())

  const [isConnected, setIsConnected] = useState(false)
  const [isHealthy, setIsHealthy] = useState(false)
  const [centralClient, setCentralClient] = useState<WsClient | null>(null)

  // Track registered handlers so they can be re-attached when new server
  // clients are added to the pool.
  const globalHandlersRef = useRef<Set<WsEventHandler>>(new Set())
  const eventHandlersRef = useRef<Map<string, Set<WsEventHandler>>>(new Map())
  const channelSubsRef = useRef<Set<string>>(new Set())

  // Create central WS connection (cylo-api via /ws-api path on api.{domain})
  useEffect(() => {
    if (!enabled) return

    const domain = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || `wss://api.${domain}`

    // Append /ws-api path — nginx proxies this to the cylo-api ws-gateway (port 9091)
    const wsUrl = wsBaseUrl.replace(/\/+$/, "") + "/ws-api"

    const client = new WsClient({
      url: wsUrl,
      onConnect: () => {
        setIsConnected(true)
        setIsHealthy(true)
      },
      onDisconnect: () => {
        setIsConnected(false)
        setIsHealthy(false)
      },
      onReconnect: () => {
        queryClient.invalidateQueries()
      }
    })

    // Invalidate 2FA-related queries when the backend pushes state changes.
    // This keeps the profile page and 2FA setup page in sync without relying
    // on mutation onSuccess callbacks, and works across tabs.
    client.on("user.2fa_enabled", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me })
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    })
    client.on("user.2fa_disabled", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me })
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    })
    client.on("user.2fa_recovery_codes_regenerated", () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    })

    centralRef.current = client
    queueMicrotask(() => setCentralClient(client))
    client.connect()

    return () => {
      client.disconnect()
      centralRef.current = null
      setCentralClient(null)
    }
  }, [enabled, queryClient])

  // Internal helper: create and connect a single server client
  const _createServerClient = useCallback(
    (serverName: string): WsClient => {
      const domain = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"

      // nginx proxies /ws to the cylo-serverapi ws-gateway (port 9090)
      const client = new WsClient({
        url: `wss://${serverName}.${domain}/ws`,
        onConnect: () => {
          // Re-subscribe to all tracked channels on this client
          channelSubsRef.current.forEach((ch) => client.subscribe(ch))
        },
        onDisconnect: () => {},
        onReconnect: () => {
          channelSubsRef.current.forEach((ch) => client.subscribe(ch))
          queryClient.invalidateQueries()
        }
      })

      // Attach all existing global (onAny) handlers
      globalHandlersRef.current.forEach((handler) => client.onAny(handler))

      // Attach all existing event-specific (on) handlers
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => client.on(event, handler))
      })

      client.connect()
      return client
    },
    [queryClient]
  )

  // Connect to a specific cylo-serverapi ws-gateway. Idempotent — if a
  // connection to this server already exists in the pool it is reused.
  const connectToServer = useCallback(
    (serverName: string) => {
      if (!enabled || !serverName) return
      if (serverRefsMap.current.has(serverName)) return
      const client = _createServerClient(serverName)
      serverRefsMap.current.set(serverName, client)
    },
    [enabled, _createServerClient]
  )

  // Connect to multiple servers at once, diffing against the current pool:
  // adds new connections, removes ones that are no longer in the list.
  const connectToServers = useCallback(
    (serverNames: string[]) => {
      if (!enabled) return
      const wanted = new Set(serverNames.filter(Boolean))

      // Connect new servers
      wanted.forEach((name) => {
        if (!serverRefsMap.current.has(name)) {
          serverRefsMap.current.set(name, _createServerClient(name))
        }
      })

      // Disconnect servers no longer needed
      serverRefsMap.current.forEach((client, name) => {
        if (!wanted.has(name)) {
          client.disconnect()
          serverRefsMap.current.delete(name)
        }
      })
    },
    [enabled, _createServerClient]
  )

  // Disconnect a specific server (by name) or all servers if name omitted.
  const disconnectFromServer = useCallback((serverName?: string) => {
    if (serverName) {
      const client = serverRefsMap.current.get(serverName)
      if (client) {
        client.disconnect()
        serverRefsMap.current.delete(serverName)
      }
    } else {
      serverRefsMap.current.forEach((client) => client.disconnect())
      serverRefsMap.current.clear()
    }
  }, [])

  const on = useCallback(
    (event: string, handler: (msg: WsMessage) => void): (() => void) => {
      // Track the handler so it can be attached to future server clients
      if (!eventHandlersRef.current.has(event)) {
        eventHandlersRef.current.set(event, new Set())
      }
      eventHandlersRef.current.get(event)!.add(handler)

      const unsubs: (() => void)[] = []
      if (centralRef.current) {
        unsubs.push(centralRef.current.on(event, handler))
      }
      serverRefsMap.current.forEach((client) => {
        unsubs.push(client.on(event, handler))
      })
      return () => {
        eventHandlersRef.current.get(event)?.delete(handler)
        unsubs.forEach((u) => u())
      }
    },
    []
  )

  const onAny = useCallback(
    (handler: (msg: WsMessage) => void): (() => void) => {
      // Track the handler so it can be attached to future server clients
      globalHandlersRef.current.add(handler)

      const unsubs: (() => void)[] = []
      if (centralRef.current) {
        unsubs.push(centralRef.current.onAny(handler))
      }
      serverRefsMap.current.forEach((client) => {
        unsubs.push(client.onAny(handler))
      })
      return () => {
        globalHandlersRef.current.delete(handler)
        unsubs.forEach((u) => u())
      }
    },
    []
  )

  const subscribe = useCallback((channel: string) => {
    channelSubsRef.current.add(channel)
    centralRef.current?.subscribe(channel)
    serverRefsMap.current.forEach((client) => client.subscribe(channel))
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    channelSubsRef.current.delete(channel)
    centralRef.current?.unsubscribe(channel)
    serverRefsMap.current.forEach((client) => client.unsubscribe(channel))
  }, [])

  // Send to a named server; falls back to the first in the pool.
  const sendToServer = useCallback(
    (data: Record<string, unknown>, serverName?: string) => {
      if (serverName) {
        serverRefsMap.current.get(serverName)?.send(data)
      } else {
        const first = serverRefsMap.current.values().next().value
        first?.send(data)
      }
    },
    []
  )

  const value: WsContextValue = {
    isConnected,
    isHealthy,
    centralClient,
    on,
    onAny,
    subscribe,
    unsubscribe,
    connectToServer,
    connectToServers,
    disconnectFromServer,
    sendToServer
  }

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>
}
