"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Table } from "@cloudflare/kumo"
import type { CyloSummary } from "@/api/cylos/cylos"
import { AppboxCard } from "../appbox/appbox-card"
import { InstanceStatusBadge } from "../installed/instance-controls"
import { AppIcon } from "../ui/app-icon"
import type { StripApp } from "../ui/app-strip"
import { Panel } from "../ui/panel"
import { sampleDomain, type AppIcons } from "./catalogue"
import { Stage, useSceneScript } from "./scene"

/** Installed on the sample Appbox before the scene starts, newest first. */
const INSTALLED = ["n8n", "Jellyfin", "qBittorrent", "Nextcloud", "Plex"]

/** Installed one after another while the scene runs. */
const QUEUE = [
  "Immich",
  "Vaultwarden",
  "OpenClaw",
  "Wordpress",
  "Uptime Kuma",
  "AFFiNE",
  "Navidrome",
  "Syncthing",
  "Mattermost",
  "GitLab",
  "audiobookshelf",
  "Docmost"
]

const GiB = 1024 ** 3

/** A sample Appbox, drawn with the dashboard's own Appbox card. */
function sampleAppbox(apps: number): CyloSummary {
  return {
    id: 1,
    name: "ada",
    server_name: "ams-17",
    status: "online",
    storage_used: 1200 + (apps - INSTALLED.length) * 150,
    storage_total: 3500,
    app_slots_used: apps,
    app_slots_total: 10,
    upload_used: 842 * GiB,
    download_used: 1.9 * 1024 * GiB,
    resource_multiplier: 1,
    is_migrating: false,
    is_throttled: false,
    is_low_quota: false,
    package_name: ""
  }
}

interface Row {
  name: string
  status: "installing" | "online"
}

/**
 * Apps install one after another: each lands in the installed apps table,
 * then on the Appbox card's storage, app slots and shortcut strip.
 */
export function HeroScene({ icons }: { icons: AppIcons }) {
  const t = useTranslations("appboxmanager.installedApps")
  const sceneRef = useRef<HTMLDivElement>(null)
  const [added, setAdded] = useState<Row[]>([])

  useSceneScript(sceneRef, async (sleep) => {
    for (let next = 0; ;) {
      for (let i = 0; i < 4; i++) {
        const name = QUEUE[next++ % QUEUE.length]
        setAdded((rows) => [{ name, status: "installing" }, ...rows])
        await sleep(1700)
        setAdded((rows) =>
          rows.map((row) =>
            row.name === name ? { ...row, status: "online" } : row
          )
        )
        await sleep(1300)
      }
      await sleep(2400)
      setAdded([])
      await sleep(500)
    }
  })

  const online = added.filter((row) => row.status === "online")
  const appCount = INSTALLED.length + online.length
  const strip: StripApp[] = [
    ...[...INSTALLED].reverse(),
    ...online.map((row) => row.name).reverse()
  ].map((name, index) => ({
    id: index + 1,
    name,
    icon: icons[name] ?? "",
    domain: sampleDomain(name),
    pinned: false
  }))
  const rows: Row[] = [
    ...added,
    ...INSTALLED.map((name) => ({ name, status: "online" as const }))
  ]

  return (
    <Stage width={620} height={540} sceneRef={sceneRef}>
      <div className="ks-abs ks-lift" style={{ left: 72, top: 36, width: 600 }}>
        <Panel title="Installed apps" count={appCount} flush>
          <div className="max-h-[232px] overflow-hidden">
            <Table layout="fixed">
              <colgroup>
                <col style={{ width: "38%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{t("name")}</Table.Head>
                  <Table.Head>{t("domain")}</Table.Head>
                  <Table.Head>{t("status")}</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((row, index) => (
                  <Table.Row
                    key={row.name}
                    className={index < added.length ? "ks-rowin" : undefined}
                  >
                    <Table.Cell>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <AppIcon icon={icons[row.name] ?? ""} name={row.name} />
                        <span className="truncate font-medium">{row.name}</span>
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="block truncate font-mono text-[0.9em] text-kumo-subtle">
                        {sampleDomain(row.name)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <InstanceStatusBadge status={row.status} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Panel>
      </div>
      <div
        className="ks-abs ks-lift"
        style={{ left: 20, top: 316, width: 540 }}
      >
        <AppboxCard cylo={sampleAppbox(appCount)} apps={strip} />
      </div>
    </Stage>
  )
}
