/**
 * Container stats types — data arrives exclusively via WebSocket
 * (container_stats.update event from ws-gateway) and is stored in the
 * TanStack Query cache. There is no REST fetch.
 */

export type ContainerRange = "1h" | "24h" | "7d" | "30d"

export interface ContainerStatsHistory {
  cpu_history: { timestamp: string; value: number }[]
  mem_history: { timestamp: string; value: number }[]
  diskio_history: { timestamp: string; read: number; write: number }[]
  network_history: { timestamp: string; download: number; upload: number }[]
}
