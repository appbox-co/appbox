import type { WsMessage } from "./types"

export type WsEventHandler = (message: WsMessage) => void

interface WsClientOptions {
  url: string
  onMessage?: WsEventHandler
  onConnect?: () => void
  onDisconnect?: () => void
  onReconnect?: () => void
}

export class WsClient {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Map<string, Set<WsEventHandler>> = new Map()
  private globalHandlers: Set<WsEventHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectDelay = 30000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private isIntentionallyClosed = false
  private options: WsClientOptions
  private _isConnected = false

  constructor(options: WsClientOptions) {
    this.options = options
    this.url = options.url
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.isIntentionallyClosed = false

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this._isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.options.onConnect?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data)
          this.dispatch(message)
        } catch {
          // Ignore non-JSON messages (pong, etc.)
        }
      }

      this.ws.onclose = () => {
        this._isConnected = false
        this.stopHeartbeat()
        this.options.onDisconnect?.()
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = () => {
        // onclose will fire after onerror
      }
    } catch {
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._isConnected = false
  }

  subscribe(channel: string): void {
    this.send({ action: "subscribe", channel })
  }

  unsubscribe(channel: string): void {
    this.send({ action: "unsubscribe", channel })
  }

  on(event: string, handler: WsEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  onAny(handler: WsEventHandler): () => void {
    this.globalHandlers.add(handler)
    return () => {
      this.globalHandlers.delete(handler)
    }
  }

  private dispatch(message: WsMessage): void {
    // Notify event-specific handlers
    const handlers = this.handlers.get(message.event)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Notify global handlers
    this.globalHandlers.forEach((handler) => handler(message))

    // Notify options handler
    this.options.onMessage?.(message)
  }

  /** Send an arbitrary JSON message to the server. */
  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      this.options.onReconnect?.()
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    // Server sends ping, browser auto-responds with pong
    // We just monitor the connection is alive
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat()
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}
