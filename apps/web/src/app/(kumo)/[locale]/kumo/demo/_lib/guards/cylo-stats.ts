import type { QueryClient } from "@tanstack/react-query"
import type { CyloStats } from "@/api/cylos/cylos"
import { queryKeys } from "@/constants/query-keys"
import { cylos } from "../../fixtures"
import {
  burst,
  DAY,
  mean,
  MINUTE,
  SAMPLE_RANGES,
  wave,
  type Reading
} from "./stats"
import type { SampleHandler } from "./types"

/**
 * Sample statistics for an Appbox's charts: disk usage, disk utilisation and
 * network traffic.
 *
 * Like an app's statistics (see stats.ts) these are never fetched. The real
 * page asks for them over the server's WebSocket (`stats_range`) and the
 * answer (`stats.update`) is written straight into the query cache, where
 * `useCyloStats` reads it with its query disabled. A sample page has no
 * socket, so the samples are put in the cache with `seedCyloStatsSamples`.
 */

/** The ranges the Appbox charts offer. */
export type CyloStatsRange = "24h" | "7d" | "30d"

export const CYLO_STATS_SAMPLE_RANGES: CyloStatsRange[] = ["24h", "7d", "30d"]

/** The charts take disk space in bytes; the fixtures give it in GB. */
const GIB = 1024 ** 3

/** An Appbox that is not among the fixtures: 1 TB, 70% full. */
const FALLBACK = { storage_total: 1000, storage_used: 700 }

/** How much smaller disk usage was 30 days ago, as a share of today's. */
const MONTHLY_GROWTH = 0.15

/**
 * The small rise and fall on top of the steady growth of disk usage, as a
 * share of today's usage: a daily ripple and a slower one, as files arrive
 * and old ones are cleared out.
 */
function ripple(time: number, shift: number) {
  return (
    0.002 * wave(time, DAY, shift) + 0.004 * wave(time, 6.3 * DAY, shift * 2)
  )
}

const READINGS = {
  // Busy disks in the evening, with a long scan or unpack now and then.
  totalIo: (time: number, shift: number) =>
    7 +
    4 * wave(time, DAY, shift - 2.2) +
    2.5 * wave(time, 53 * MINUTE, shift) +
    1 * wave(time, 9 * MINUTE, shift * 2) +
    55 * burst(time, 397 * MINUTE, shift),
  // The Appbox's own share of that, between a quarter and two thirds.
  userShare: (time: number, shift: number) =>
    0.45 + 0.2 * wave(time, 211 * MINUTE, shift + 1),
  download: (time: number, shift: number) =>
    18 +
    11 * wave(time, DAY, shift - 2.4) +
    5 * wave(time, 41 * MINUTE, shift) +
    140 * burst(time, 311 * MINUTE, shift + 2),
  upload: (time: number, shift: number) =>
    26 +
    14 * wave(time, DAY, shift - 1.6) +
    6 * wave(time, 31 * MINUTE, shift * 2) +
    70 * burst(time, 487 * MINUTE, shift + 0.5)
}

const userIo: Reading = (time, shift) =>
  READINGS.totalIo(time, shift) * READINGS.userShare(time, shift)

/**
 * One range of statistics for one Appbox, in the shape `useCyloStats`
 * returns. Every value comes from sines of its own timestamp, so nothing is
 * random.
 *
 * - Disk usage is in bytes. It climbs slowly to the `storage_used` of the
 *   Appbox's fixture, where it arrives now, so the chart agrees with the
 *   storage figure shown elsewhere on the page (about 70% of the total for
 *   the first fixture). The total is the fixture's `storage_total`.
 * - Disk utilisation is in percent; the Appbox's own share never exceeds the
 *   total.
 * - Network traffic is in Mbps.
 */
export function sampleCyloStats(
  range: CyloStatsRange,
  cyloId: number,
  now = Date.now()
): CyloStats {
  const { points, step } = SAMPLE_RANGES[range]
  // Whole steps, so the series does not shift with every millisecond.
  const end = Math.floor(now / step) * step
  // Each Appbox gets its own shape.
  const shift = cyloId * 0.9

  const fixture = cylos.find((cylo) => cylo.id === cyloId) ?? FALLBACK
  const total = fixture.storage_total * GIB
  const usedNow = fixture.storage_used * GIB

  const stats: CyloStats = {
    disk_history: [],
    diskio_history: [],
    network_history: []
  }

  for (let index = points - 1; index >= 0; index--) {
    const time = end - index * step
    const timestamp = new Date(time).toISOString()
    const read = (reading: Reading, floor: number) =>
      mean(reading, time, step, shift, floor)

    const age = (now - time) / (30 * DAY)
    const used =
      usedNow *
      (1 - MONTHLY_GROWTH * age + ripple(time, shift) - ripple(now, shift))

    stats.disk_history.push({
      timestamp,
      used: Math.round(Math.min(total, Math.max(0, used))),
      total
    })
    stats.diskio_history.push({
      timestamp,
      user_util: read(userIo, 0.05),
      io_util: read(READINGS.totalIo, 0.2)
    })
    stats.network_history.push({
      timestamp,
      upload: read(READINGS.upload, 0.05),
      download: read(READINGS.download, 0.05)
    })
  }

  return stats
}

/**
 * Puts sample statistics for every range of the picker into the query cache,
 * under the keys `useCyloStats` reads: what the WebSocket bridge does on the
 * real page. That includes the key without a range, which holds the latest
 * history for anything that does not choose one. Call it with the sample
 * page's query client, once per Appbox shown.
 */
export function seedCyloStatsSamples(
  client: QueryClient,
  cyloId: number,
  now = Date.now()
) {
  for (const range of CYLO_STATS_SAMPLE_RANGES) {
    client.setQueryData<CyloStats>(
      [...queryKeys.cylos.stats(cyloId), range],
      sampleCyloStats(range, cyloId, now)
    )
  }
  client.setQueryData<CyloStats>(
    queryKeys.cylos.stats(cyloId),
    sampleCyloStats("24h", cyloId, now)
  )
}

/**
 * The charts make no HTTP request (see above), so there is nothing here for
 * the fetch guard to answer. Kept so that every feature registers a handler
 * the same way.
 */
export const cyloStatsSamples: SampleHandler = () => undefined
