"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Link as KumoLink } from "@cloudflare/kumo"
import { BoostSlider } from "../install/boost-slider"
import { Panel } from "../ui/panel"
import { Stage, useSceneScript } from "./scene"

/**
 * The App Boost card from an installed app's page, built from the same slider
 * and strings: Plex takes three spare slots, then Apply Boost.
 */
export function BoostScene() {
  const t = useTranslations("appboxmanager.appDetail")
  const sceneRef = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState(3)
  const [applying, setApplying] = useState(false)

  // It starts from the first frame, three slots, so the slider is still as the
  // scene appears, and goes back to none before stepping up again.
  useSceneScript(sceneRef, async (sleep) => {
    for (;;) {
      await sleep(600)
      setApplying(true)
      await sleep(1200)
      setApplying(false)
      await sleep(2600)
      setSlots(0)
      await sleep(1500)
      for (const next of [1, 2, 3]) {
        setSlots(next)
        await sleep(800)
      }
    }
  })

  return (
    <Stage width={520} height={580} sceneRef={sceneRef}>
      <div className="ks-abs ks-lift" style={{ left: 56, top: 40, width: 420 }}>
        <Panel title={t("boost.title")}>
          <div className="grid grid-cols-1 gap-4">
            <p className="text-kumo-subtle">{t("boost.description")}</p>
            <BoostSlider
              value={slots}
              max={5}
              boostIncrement={0.1}
              maxBoostMultiplier={8}
              baseMemory={2}
              baseCpus={1}
              appSlotsCost={1}
              cyloFreeSlots={0}
              onChange={() => {}}
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
            <p className="text-kumo-subtle">{t("boost.dockerLive")}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <KumoLink href="#">{t("boost.getMore")}</KumoLink>
              <Button variant="primary" loading={applying}>
                {applying ? t("boost.applying") : t("boost.apply")}
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </Stage>
  )
}
