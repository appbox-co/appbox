"use client"

import { useTranslations } from "next-intl"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  HardDrive,
  Layers,
  Rocket
} from "lucide-react"
import type { CyloDetail } from "@/api/cylos/cylos"
import { useCyloBandwidth, useCyloDiskQuota } from "@/api/cylos/hooks/use-cylos"
import { useInstalledApps } from "@/api/installed-apps/hooks/use-installed-apps"
import { StatCard } from "@/components/dashboard/stat-card"
import { formatBytes, formatStorageGB } from "@/lib/utils"

interface CyloStatsProps {
  cylo: CyloDetail
  userId?: number
}

export function CyloStats({ cylo, userId }: CyloStatsProps) {
  const t = useTranslations("appboxmanager")
  const { data: quota } = useCyloDiskQuota(cylo.id)
  const { data: bandwidth } = useCyloBandwidth(cylo.id)
  const { data: installedApps } = useInstalledApps(cylo.id, userId)

  const storageUsed = quota?.used_gb ?? cylo.storage_used
  const storageTotal = cylo.storage_total
  const uploadUsed = bandwidth?.upload_bytes ?? cylo.upload_used
  const downloadUsed = bandwidth?.download_bytes ?? cylo.download_used

  const storagePercent =
    storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0
  const totalBoostSlots =
    installedApps?.reduce((sum, app) => sum + (app.boost_slots ?? 0), 0) ?? 0

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("cylos.storage")}
        value={`${formatStorageGB(storageUsed)} / ${formatStorageGB(storageTotal)}`}
        icon={<HardDrive className="size-5" />}
        iconColor="blue"
        type="usage"
        progress={storagePercent}
      />

      <StatCard
        label={`${t("cyloDetail.bandwidth")} (30d)`}
        value={formatBytes(uploadUsed + downloadUsed)}
        description={`${t("cyloDetail.uploadUsed")}: ${formatBytes(uploadUsed)} | ${t("cyloDetail.downloadUsed")}: ${formatBytes(downloadUsed)}`}
        icon={
          <div className="flex flex-col gap-0.5">
            <ArrowUpFromLine className="size-4" />
            <ArrowDownToLine className="size-4" />
          </div>
        }
        iconColor="cyan"
      />

      <StatCard
        label={t("cylos.appSlots")}
        value={`${cylo.app_slots_used} / ${cylo.app_slots_total}`}
        icon={<Layers className="size-5" />}
        iconColor="emerald"
        type="usage"
        progress={
          cylo.app_slots_total > 0
            ? Math.round((cylo.app_slots_used / cylo.app_slots_total) * 100)
            : 0
        }
      />

      <StatCard
        label={t("cylos.multiplier")}
        value={`${totalBoostSlots} slots`}
        icon={<Rocket className="size-5" />}
        iconColor="amber"
      />
    </div>
  )
}
