"use client"

import { useTranslations } from "next-intl"
import { Network } from "lucide-react"
import {
  DedicatedIpv4BuyButton,
  DedicatedIpv4Panel
} from "@/components/dashboard/dedicated-ipv4/dedicated-ipv4-panel"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { isNextLaunchWeekEnabled } from "@/config/launch-week-flags"
import { useAuth } from "@/providers/auth-provider"

export default function DedicatedIpv4Page() {
  const t = useTranslations("appboxmanager.dedicatedIpv4")
  const { isAdmin } = useAuth()
  const enabled = isNextLaunchWeekEnabled("day_4", isAdmin)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("pageDescription")}
        icon={<Network className="size-[18px]" />}
        gradient="from-[#0ea5e9] to-[#6366f1]"
        action={enabled ? <DedicatedIpv4BuyButton /> : undefined}
      />
      {enabled ? (
        <DedicatedIpv4Panel />
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {t("notAvailable")}
        </div>
      )}
    </div>
  )
}
