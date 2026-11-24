"use client"

import { useRef, useState } from "react"
import { Badge, Banner, Button, cn } from "@cloudflare/kumo"
import {
  CaretUpDownIcon,
  CloudArrowDownIcon,
  CopyIcon,
  InfoIcon,
  XIcon
} from "@phosphor-icons/react"
import { InstanceStatusBadge } from "../instance-controls"
import { Panel } from "../panel"
import { sampleDomain, type AppIcons } from "./catalogue"
import { SceneIcon, Stage, useSceneLoop } from "./scene"

const APP = "Nextcloud"

/** The server's own job messages for an install, in order. */
const STEPS = [
  "Creating SSL certificate...",
  `Transferring ${APP} to your appbox...`,
  `Configuring ${APP}...`
]

type View = "store" | "app"

/** Kumo's select trigger, as the install dialog draws it. */
const SELECT =
  "flex h-9 w-full items-center justify-between gap-1.5 rounded-lg bg-kumo-control px-3 font-normal text-kumo-default shadow-xs ring ring-kumo-line"

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="font-medium text-kumo-default">{label}</div>
      {children}
    </div>
  )
}

function Row({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-kumo-subtle">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 truncate text-end font-medium">
        {children}
        <span className="flex size-6.5 items-center justify-center rounded-md text-kumo-subtle ring ring-kumo-line">
          <CopyIcon size={14} />
        </span>
      </dd>
    </div>
  )
}

/**
 * Installing an app: Install on its App Store page opens the install dialog,
 * the form fills itself in, and the app's own page follows the install
 * through the server's real job steps until it's online.
 */
export function InstallScene({ icons }: { icons: AppIcons }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>("store")
  const [dialog, setDialog] = useState(false)
  const [focus, setFocus] = useState<"appbox" | "password" | null>(null)
  const [appbox, setAppbox] = useState(true)
  const [password, setPassword] = useState(12)
  const [pressed, setPressed] = useState<"store" | "dialog" | null>(null)
  const [step, setStep] = useState(0)
  const [online, setOnline] = useState(false)

  useSceneLoop(sceneRef, async (sleep) => {
    setView("store")
    setDialog(false)
    setOnline(false)
    await sleep(900)
    setPressed("store")
    await sleep(160)
    setPressed(null)
    setAppbox(false)
    setPassword(0)
    setDialog(true)
    await sleep(800)
    setFocus("appbox")
    await sleep(500)
    setAppbox(true)
    await sleep(400)
    setFocus(null)
    await sleep(300)
    setFocus("password")
    for (let i = 1; i <= 12; i++) {
      setPassword(i)
      await sleep(55)
    }
    await sleep(300)
    setFocus(null)
    await sleep(300)
    setPressed("dialog")
    await sleep(160)
    setPressed(null)
    setDialog(false)
    await sleep(200)
    setView("app")
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i)
      await sleep(1300)
    }
    setOnline(true)
    await sleep(3600)
  })

  const domain = sampleDomain(APP)

  return (
    <Stage width={580} height={520} sceneRef={sceneRef}>
      <div
        className="ks-abs ks-pagecard"
        style={{ left: 120, top: 96, width: 480 }}
      >
        {view === "store" ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <SceneIcon
                icons={icons}
                name={APP}
                size={52}
                className="ks-appicon"
              />
              <div className="grid gap-1">
                <h1 className="text-2xl font-semibold">{APP}</h1>
                <p className="flex flex-wrap items-center gap-1.5 text-kumo-subtle">
                  {APP}
                  <Badge variant="secondary">Sync</Badge>
                  <Badge variant="secondary">File Manager</Badge>
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg bg-kumo-base px-5 py-4 shadow-xs ring ring-kumo-line">
              <Button
                variant="primary"
                icon={CloudArrowDownIcon}
                className={cn(
                  "h-10 w-full justify-center",
                  pressed === "store" && "ks-press"
                )}
              >
                Install
              </Button>
              <p className="text-center text-kumo-subtle">
                Uses 1 app slot on your Appbox.
              </p>
            </div>
          </div>
        ) : (
          <div className="ks-in grid gap-4">
            <div className="flex items-center gap-4">
              <SceneIcon
                icons={icons}
                name={APP}
                size={52}
                className="ks-appicon"
              />
              <div className="grid min-w-0 gap-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="min-w-0 text-2xl font-semibold">{APP}</h1>
                  <InstanceStatusBadge
                    status={online ? "online" : "installing"}
                  />
                </div>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-kumo-subtle">
                  <span className="font-mono text-[0.9em]">{domain}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    on{" "}
                    <span className="font-medium text-kumo-default">ada</span>
                  </span>
                </p>
              </div>
            </div>
            {online ? (
              <div className="ks-in">
                <Panel title="Configuration">
                  <dl className="-my-2 divide-y divide-kumo-hairline">
                    <Row label="Web address">
                      <span className="font-mono text-[0.9em] text-kumo-link">
                        https://{domain}
                      </span>
                    </Row>
                    <Row label="Admin Username">admin</Row>
                    <Row label="Admin Password">
                      <span className="font-mono">••••••••••••</span>
                    </Row>
                  </dl>
                </Panel>
              </div>
            ) : (
              <Banner
                icon={<InfoIcon weight="fill" />}
                title="Installing"
                description={STEPS[step]}
              />
            )}
          </div>
        )}
        <div className={cn("ks-backdrop", !dialog && "ks-off")} />
      </div>

      <div
        className={cn("ks-abs ks-dialog-pos", !dialog && "ks-closed")}
        style={{ left: 24, top: 24, width: 420 }}
      >
        <div className="ks-lift overflow-hidden rounded-xl bg-kumo-base text-kumo-default">
          <header className="relative grid gap-1.5 border-b border-kumo-line py-5 ps-6 pe-16">
            <h2 className="text-lg font-semibold">Install {APP}</h2>
            <p className="text-kumo-subtle">Requires 1 app slot(s)</p>
            <XIcon
              size={16}
              className="absolute top-[22px] right-[22px] text-kumo-subtle"
            />
          </header>
          <div className="grid gap-5 px-6 py-5">
            <Field label="Select Appbox">
              <span className={cn(SELECT, focus === "appbox" && "ks-focus")}>
                {appbox ? (
                  <span className="flex items-baseline gap-1.5">
                    <span>ada</span>
                    <span className="text-kumo-subtle tabular-nums">
                      (5 slots free)
                    </span>
                  </span>
                ) : (
                  <span className="text-kumo-placeholder">Select Appbox</span>
                )}
                <CaretUpDownIcon
                  size={16}
                  className="shrink-0 text-kumo-subtle"
                />
              </span>
            </Field>
            <Field label="Subdomain *">
              <div className="flex h-9 items-stretch overflow-hidden rounded-lg bg-kumo-control ring ring-kumo-line">
                <span className="flex flex-1 items-center px-3 font-mono text-[0.9em]">
                  nextcloud
                </span>
                <span className="flex items-center border-s border-kumo-line bg-kumo-elevated px-3 font-mono text-[0.9em] text-kumo-subtle">
                  .ada.appboxes.co
                </span>
              </div>
            </Field>
            <Field label="Admin Password *">
              <div
                className={cn(
                  "flex h-9 items-center rounded-lg bg-kumo-control px-3 ring ring-kumo-line",
                  focus === "password" && "ks-focus"
                )}
              >
                <span className="font-mono text-[0.9em]">
                  {"•".repeat(password)}
                </span>
                {focus === "password" && <span className="ks-caret" />}
              </div>
            </Field>
          </div>
          <footer className="flex justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Button variant="secondary">Cancel</Button>
            <Button
              variant="primary"
              className={cn(pressed === "dialog" && "ks-press")}
            >
              Install
            </Button>
          </footer>
        </div>
      </div>
    </Stage>
  )
}
