"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, cn, Tabs } from "@cloudflare/kumo"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"
import { AppIcon } from "../app-icon"
import { InstanceStatusBadge } from "../instance-controls"
import { Panel } from "../panel"
import { sampleDomain, type AppIcons } from "./catalogue"
import { Stage, useSceneScript } from "./scene"

interface LinuxSystem {
  name: string
  host: string
  tty: string
  prompt: string
  commands: string[]
}

type System = LinuxSystem | { name: string; windows: true }

/** The VPS apps in the catalogue, each showing something it's good for. */
const SYSTEMS: System[] = [
  {
    name: "Debian VPS",
    host: "debian",
    tty: "Debian GNU/Linux 13 debian tty1",
    prompt: "root@debian:~# ",
    commands: ["apt install -y docker.io", "docker run -d -p 8080:80 nginx"]
  },
  {
    name: "Ubuntu VPS",
    host: "ubuntu",
    tty: "Ubuntu 24.04 LTS ubuntu tty1",
    prompt: "root@ubuntu:~# ",
    commands: ["snap install code --classic", "docker run hello-world"]
  },
  {
    name: "Arch Linux VPS",
    host: "arch",
    tty: "Arch Linux (tty1)",
    prompt: "[root@arch ~]# ",
    commands: ["pacman -Syu --noconfirm", "pacman -S --noconfirm neovim"]
  },
  {
    name: "Fedora VPS",
    host: "fedora",
    tty: "Fedora Linux (Server Edition)",
    prompt: "[root@fedora ~]# ",
    commands: ["dnf install -y podman", "podman ps"]
  },
  { name: "Windows 11 Pro VPS", windows: true },
  {
    name: "Rocky Linux VPS",
    host: "rocky",
    tty: "Rocky Linux 9",
    prompt: "[root@rocky ~]# ",
    commands: ["dnf install -y nginx", "systemctl enable --now nginx"]
  },
  {
    name: "AlmaLinux VPS",
    host: "alma",
    tty: "AlmaLinux 9",
    prompt: "[root@alma ~]# ",
    commands: ["flatpak install -y flathub org.gimp.GIMP", "uptime -p"]
  }
]

const login = (system: LinuxSystem) =>
  `${system.tty}\n\n${system.host} login: root\nPassword:\n`

function Screen({ system, typed }: { system: System; typed: string }) {
  if ("windows" in system) {
    return (
      <div className="ks-desk">
        <div className="ks-desk-win">
          <b>This PC</b>
          <div className="ks-desk-drive">
            <span>Local Disk (C:)</span>
            <span>64 GB</span>
          </div>
          <div className="ks-desk-drive">
            <span>Appbox (Z:)</span>
            <span>3.5 TB</span>
          </div>
        </div>
        <div className="ks-desk-task">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    )
  }
  return (
    <div className="ks-screen">
      <span className="ks-dim">{login(system)}</span>
      {typed}
    </div>
  )
}

/**
 * A VPS app's page on its Console tab, switching between the Linux systems
 * and Windows 11 Pro. On Linux, commands type themselves at the prompt.
 */
export function ServersScene({ icons }: { icons: AppIcons }) {
  const t = useTranslations("appboxmanager.appDetail")
  const sceneRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(() => {
    const first = SYSTEMS[0] as LinuxSystem
    return first.prompt + first.commands[0]
  })
  const [hidden, setHidden] = useState(false)

  useSceneScript(sceneRef, async (sleep) => {
    for (let current = 0; ; current = (current + 1) % SYSTEMS.length) {
      const system = SYSTEMS[current]
      setIndex(current)
      setHidden(false)
      await sleep(400)
      if ("windows" in system) {
        await sleep(3200)
      } else {
        let text = system.prompt
        setTyped(text)
        for (const command of system.commands) {
          await sleep(350)
          for (const char of command) {
            text += char
            setTyped(text)
            await sleep(40)
          }
          await sleep(500)
          text += `\n${system.prompt}`
          setTyped(text)
        }
        await sleep(1500)
      }
      setHidden(true)
      await sleep(350)
      setTyped("")
    }
  })

  const system = SYSTEMS[index]

  return (
    <Stage width={620} height={500} sceneRef={sceneRef}>
      <div
        className="ks-abs ks-pagecard"
        style={{ left: 40, top: 36, width: 600 }}
      >
        <div
          className={cn("ks-swap flex items-center gap-4", hidden && "ks-gone")}
        >
          <AppIcon
            icon={icons[system.name] ?? ""}
            name={system.name}
            size={52}
            className="ks-appicon"
          />
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="min-w-0 text-2xl font-semibold">{system.name}</h1>
              <InstanceStatusBadge status="online" />
            </div>
            <p className="flex flex-wrap items-center gap-x-2 text-kumo-subtle">
              <span className="font-mono text-[0.9em]">
                {sampleDomain(system.name)}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                on <span className="font-medium text-kumo-default">ada</span>
              </span>
            </p>
          </div>
        </div>
        <div className="flex">
          <Tabs
            variant="segmented"
            tabs={[
              { value: "overview", label: t("tabOverview") },
              { value: "ports", label: t("tabPorts") },
              { value: "console", label: t("tabConsole") }
            ]}
            value="console"
          />
        </div>
        <Panel
          title={t("consoleTitle")}
          flush
          action={
            <>
              <Badge variant="success" appearance="dot">
                {t("consoleConnected")}
              </Badge>
              <Button size="sm" icon={ArrowsClockwiseIcon}>
                {t("consoleReconnect")}
              </Button>
            </>
          }
        >
          <div className={cn("ks-swap p-1", hidden && "ks-gone")}>
            <Screen system={system} typed={typed} />
          </div>
        </Panel>
      </div>
      <div
        className="ks-abs flex flex-wrap gap-1.5"
        style={{ left: 40, bottom: 22 }}
      >
        {SYSTEMS.map((entry) =>
          entry === system ? (
            <Badge key={entry.name} variant="success" appearance="dot">
              {entry.name.replace(" VPS", "")}
            </Badge>
          ) : (
            <Badge key={entry.name} variant="secondary">
              {entry.name.replace(" VPS", "")}
            </Badge>
          )
        )}
      </div>
    </Stage>
  )
}
