import type { QueryClient } from "@tanstack/react-query"
import type {
  ContainerRange,
  ContainerStatsHistory
} from "@/api/installed-apps/container-stats"
import { queryKeys } from "@/constants/query-keys"
import type { SampleHandler } from "./types"

/**
 * Sample container statistics for the performance charts.
 *
 * Container statistics are never fetched. The real page asks for them over
 * the server's WebSocket (`container_stats_range`) and the answer
 * (`container_stats.update`) is written straight into the query cache, where
 * `useContainerStats` reads it with its query disabled. A sample page has no
 * socket, so no request ever reaches the fetch guard: the samples have to be
 * put in the cache instead, with `seedStatsSamples`.
 */

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * How many points each range of a picker has, and how far apart. Shared with
 * the Appbox's own charts (cylo-stats.ts), which offer all but the first.
 */
export const SAMPLE_RANGES: Record<
  ContainerRange,
  { points: number; step: number }
> = {
  "1h": { points: 60, step: MINUTE },
  "24h": { points: 288, step: 5 * MINUTE },
  "7d": { points: 168, step: HOUR },
  "30d": { points: 180, step: 4 * HOUR }
}

export const STATS_SAMPLE_RANGES = Object.keys(
  SAMPLE_RANGES
) as ContainerRange[]

/** A sine of the given period, from -1 to 1, at a moment in time. */
export function wave(time: number, period: number, phase = 0) {
  return Math.sin((2 * Math.PI * time) / period + phase)
}

/** Mostly zero, with a short peak once per period: a backup, a scan, a download. */
export function burst(time: number, period: number, phase = 0) {
  return Math.max(0, wave(time, period, phase)) ** 12
}

/**
 * What an app is doing at one moment. `shift` gives each app its own shape.
 * The periods are deliberately not round numbers of hours, so that no series
 * falls into step with the spacing of a range and repeats.
 */
const READINGS = {
  // Busier in the evening, a little restless, with a sharp peak now and then.
  cpu: (time: number, shift: number) =>
    16 +
    9 * wave(time, DAY, shift - 2.4) +
    4 * wave(time, 47 * MINUTE, shift) +
    2 * wave(time, 7 * MINUTE, shift * 3) +
    48 * burst(time, 367 * MINUTE, shift),
  // Slow to move: a daily swell and a gentle drift over the week.
  memory: (time: number, shift: number) =>
    44 +
    5 * wave(time, DAY, shift - 1.8) +
    3 * wave(time, 7 * DAY, shift) +
    1.2 * wave(time, 97 * MINUTE, shift * 2),
  read: (time: number, shift: number) =>
    0.5 +
    0.35 * wave(time, 173 * MINUTE, shift) +
    0.1 * wave(time, 11 * MINUTE, shift * 2) +
    6 * burst(time, 463 * MINUTE, shift + 1),
  write: (time: number, shift: number) =>
    0.9 +
    0.5 * wave(time, 131 * MINUTE, shift + 0.6) +
    0.2 * wave(time, 13 * MINUTE, shift) +
    9 * burst(time, 367 * MINUTE, shift),
  download: (time: number, shift: number) =>
    9 +
    6 * wave(time, DAY, shift - 2.4) +
    2.5 * wave(time, 37 * MINUTE, shift) +
    60 * burst(time, 293 * MINUTE, shift + 2),
  upload: (time: number, shift: number) =>
    3.5 +
    2 * wave(time, DAY, shift - 2) +
    1.2 * wave(time, 29 * MINUTE, shift * 2) +
    22 * burst(time, 541 * MINUTE, shift + 0.5)
}

export type Reading = (time: number, shift: number) => number

const SLICES = 8

/**
 * A reading averaged over the step that ends at `time`, never below `floor`.
 * A point of a long range stands for hours, so it is the mean of those hours,
 * not whatever the app happened to be doing at the last moment of them.
 */
export function mean(
  reading: Reading,
  time: number,
  step: number,
  shift: number,
  floor: number
) {
  let total = 0
  for (let slice = 0; slice < SLICES; slice++) {
    total += Math.max(floor, reading(time - (slice * step) / SLICES, shift))
  }
  return Math.round((total / SLICES) * 100) / 100
}

/**
 * One range of statistics for one app, in the shape `useContainerStats`
 * returns. Every value comes from sines of its own timestamp, so a given
 * moment always gets the same reading and nothing is random. CPU and memory
 * are percentages, disk is in MB/s and network in Mbps.
 */
export function sampleContainerStats(
  range: ContainerRange,
  instanceId = 1,
  now = Date.now()
): ContainerStatsHistory {
  const { points, step } = SAMPLE_RANGES[range]
  // Whole steps, so the series does not shift with every millisecond.
  const end = Math.floor(now / step) * step
  const shift = instanceId * 0.7

  const stats: ContainerStatsHistory = {
    cpu_history: [],
    mem_history: [],
    diskio_history: [],
    network_history: []
  }

  for (let index = points - 1; index >= 0; index--) {
    const time = end - index * step
    const timestamp = new Date(time).toISOString()
    const read = (reading: Reading, floor: number) =>
      mean(reading, time, step, shift, floor)

    stats.cpu_history.push({ timestamp, value: read(READINGS.cpu, 0.4) })
    stats.mem_history.push({ timestamp, value: read(READINGS.memory, 2) })
    stats.diskio_history.push({
      timestamp,
      read: read(READINGS.read, 0),
      write: read(READINGS.write, 0)
    })
    stats.network_history.push({
      timestamp,
      download: read(READINGS.download, 0.05),
      upload: read(READINGS.upload, 0.02)
    })
  }

  return stats
}

/**
 * Puts sample statistics for every range of the picker into the query cache,
 * under the keys `useContainerStats` reads: what the WebSocket bridge does on
 * the real page. Call it with the sample page's query client before the
 * charts render, once per app shown.
 */
export function seedStatsSamples(
  client: QueryClient,
  instanceId: number,
  now = Date.now()
) {
  for (const range of STATS_SAMPLE_RANGES) {
    client.setQueryData<ContainerStatsHistory>(
      [...queryKeys.installedApps.containerStats(instanceId), range],
      sampleContainerStats(range, instanceId, now)
    )
  }
}

/**
 * The charts make no HTTP request (see above), so there is nothing here for
 * the fetch guard to answer. Kept so that every feature registers a handler
 * the same way, and as the place to answer a statistics endpoint if one is
 * ever added.
 */
export const statsSamples: SampleHandler = () => undefined
