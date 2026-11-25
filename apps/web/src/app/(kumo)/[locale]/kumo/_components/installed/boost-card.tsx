"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Link as KumoLink } from "@cloudflare/kumo"
import { useBoostApp } from "@/api/installed-apps/hooks/use-installed-apps"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { BoostSlider } from "../install/boost-slider"
import { upgradeUrl } from "../shared"
import { Panel } from "../ui/panel"

interface BoostCardProps {
  app: InstalledApp
  whmcsServiceId?: number | string
  disabled?: boolean
}

/** Trade spare app slots for more memory and CPU on this app. */
export function BoostCard({ app, whmcsServiceId, disabled }: BoostCardProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const boostMutation = useBoostApp()
  const isDisabled = disabled || app.vm_control_pending === true
  const [boostSlots, setBoostSlots] = useState(app.boost_slots ?? 0)

  useEffect(() => {
    queueMicrotask(() => setBoostSlots(app.boost_slots ?? 0))
  }, [app.boost_slots])

  const hasChanges = boostSlots !== (app.boost_slots ?? 0)
  const isVm = app.app_type === "vm"
  const planUpgradeUrl = whmcsServiceId ? upgradeUrl(whmcsServiceId) : undefined

  const helperText = useMemo(() => {
    if (isVm) {
      return t("boost.vmRestart")
    }
    return t("boost.dockerLive")
  }, [isVm, t])

  return (
    <Panel title={t("boost.title")}>
      <div className="grid grid-cols-1 gap-4">
        <p className="text-kumo-subtle">{t("boost.description")}</p>

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
          disabled={isDisabled || boostMutation.isPending}
          upgradeUrl={planUpgradeUrl}
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

        <p className="text-kumo-subtle">{helperText}</p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {planUpgradeUrl ? (
            <KumoLink
              href={planUpgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("boost.getMore")}
              <KumoLink.ExternalIcon />
            </KumoLink>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="primary"
            loading={boostMutation.isPending}
            onClick={() => {
              if (isDisabled) return
              boostMutation.mutate({
                id: app.id,
                boostSlots
              })
            }}
            disabled={isDisabled || !hasChanges || boostMutation.isPending}
          >
            {boostMutation.isPending ? t("boost.applying") : t("boost.apply")}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
