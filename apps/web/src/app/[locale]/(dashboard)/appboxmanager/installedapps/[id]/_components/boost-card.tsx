"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { ExternalLink, Rocket } from "lucide-react"
import { useBoostApp } from "@/api/installed-apps/hooks/use-installed-apps"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { BoostSlider } from "@/components/dashboard/boost-slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BoostCardProps {
  app: InstalledApp
  whmcsServiceId?: number | string
  disabled?: boolean
}

const BILLING_BASE_URL = "https://billing.appbox.co"

export function BoostCard({ app, whmcsServiceId, disabled }: BoostCardProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const boostMutation = useBoostApp()
  const [boostSlots, setBoostSlots] = useState(app.boost_slots ?? 0)

  useEffect(() => {
    queueMicrotask(() => setBoostSlots(app.boost_slots ?? 0))
  }, [app.boost_slots])

  const hasChanges = boostSlots !== (app.boost_slots ?? 0)
  const isVm = app.app_type === "vm"
  const upgradeUrl = whmcsServiceId
    ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${whmcsServiceId}`
    : undefined

  const helperText = useMemo(() => {
    if (isVm) {
      return t("boost.vmRestart")
    }
    return t("boost.dockerLive")
  }, [isVm, t])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="size-4 text-primary" />
          {t("boost.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("boost.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <BoostSlider
          value={boostSlots}
          max={Math.max(0, app.max_boost_slots ?? 0)}
          boostIncrement={app.boost_increment ?? 0.1}
          maxBoostMultiplier={app.max_boost_multiplier ?? 8}
          baseMemory={app.ram ?? 0}
          baseCpus={app.cpus ?? 0}
          appSlotsCost={app.app_slots ?? 0}
          cyloFreeSlots={0}
          onChange={setBoostSlots}
          disabled={disabled || boostMutation.isPending}
          upgradeUrl={upgradeUrl}
          showHeader={false}
          showUpgradeCta={false}
          labels={{
            title: t("boost.title"),
            resourcePreview: t("boost.resourcePreview"),
            multiplier: t("boost.multiplier"),
            slotCost: t("boost.slotCost"),
            ram: t("boost.ram"),
            cpus: t("boost.cpus"),
            cta: t("boost.getMore")
          }}
        />

        <p className="text-xs text-muted-foreground">{helperText}</p>

        <div className="flex items-center justify-between">
          {upgradeUrl ? (
            <a
              href={upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {t("boost.getMore")}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={() =>
              boostMutation.mutate({
                id: app.id,
                boostSlots
              })
            }
            disabled={disabled || !hasChanges || boostMutation.isPending}
          >
            {boostMutation.isPending ? t("boost.applying") : t("boost.apply")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
