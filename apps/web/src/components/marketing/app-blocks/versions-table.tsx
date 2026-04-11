"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import type { AppVersion } from "@/api/appbox/hooks/use-app-details"

interface VersionsTableProps {
  versions: AppVersion[]
  appSlotsFallback: number
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  } catch {
    return dateStr
  }
}

function formatMemory(memory: number): string {
  if (!Number.isFinite(memory)) return "—"
  return memory === 0 ? "Shared" : `${memory} GB`
}

function formatCpus(cpus: number): string {
  if (!Number.isFinite(cpus)) return "—"
  return cpus === 0 ? "Shared" : String(cpus)
}

export function VersionsTable({
  versions,
  appSlotsFallback
}: VersionsTableProps) {
  if (!versions || versions.length === 0) return null

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-8 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Available versions
        </h2>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">Version</th>
                <th className="px-4 py-3 text-left font-medium">App Slots</th>
                <th className="px-4 py-3 text-left font-medium">RAM</th>
                <th className="px-4 py-3 text-left font-medium">CPU</th>
                <th className="px-4 py-3 text-left font-medium">Released</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  Changes
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => {
                const appSlots = Number(v.app_slots ?? 0)
                return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{v.version}</td>
                    <td className="px-4 py-3">
                      {appSlots > 0 ? appSlots : appSlotsFallback}
                    </td>
                    <td className="px-4 py-3">
                      {formatMemory(Number(v.memory ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      {formatCpus(Number(v.cpus ?? 0))}
                    </td>
                    <td className="px-4 py-3">{formatDate(v.created_at)}</td>
                    <td className="text-muted-foreground hidden px-4 py-3 md:table-cell">
                      <span className="line-clamp-2">{v.changes || "—"}</span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 flex items-start gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm text-muted-foreground"
        >
          <Zap className="mt-0.5 size-4 shrink-0 text-indigo-500" />
          <p>
            Need more resources? Use{" "}
            <span className="font-medium text-foreground">Per-App Boost</span>{" "}
            to allocate extra App Slots and increase RAM and CPU by 10% per
            slot. See the FAQ below for details.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
