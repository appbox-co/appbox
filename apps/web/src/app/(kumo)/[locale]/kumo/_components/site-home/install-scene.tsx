"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Banner, Button, cn, InputGroup, Select } from "@cloudflare/kumo"
import {
  CloudArrowDownIcon,
  EyeIcon,
  InfoIcon,
  XIcon
} from "@phosphor-icons/react"
import type { CustomField } from "@/api/apps/app-store"
import { AppIcon } from "../app-icon"
import { withRequiredMark } from "../install/field-parts"
import { CustomFields } from "../installed/custom-fields"
import { InstanceStatusBadge } from "../instance-controls"
import { sampleDomain, type AppIcons } from "./catalogue"
import { Stage, useSceneScript } from "./scene"

const APP = "Nextcloud"
const DOMAIN = sampleDomain(APP)

/** Nextcloud's install field, as the catalogue labels it. */
const PASSWORD_LABEL = "Admin Password"

/** The Configuration card of the installed app, as the catalogue fills it. */
const CONFIGURATION: Record<string, CustomField> = {
  url: {
    label: "Web address",
    type: "externalURL",
    width: 12,
    defaultValue: `https://${DOMAIN}`
  },
  admin_user: {
    label: "Admin Username",
    type: "dynamicText",
    width: 12,
    defaultValue: "admin"
  },
  admin_password: {
    label: PASSWORD_LABEL,
    type: "password",
    width: 12,
    defaultValue: "sample"
  }
}

type Field = "appbox" | "password" | null

/**
 * Installing an app: Install on its App Store page opens the install dialog,
 * the form fills itself in, and the app's own page follows the install
 * through the server's job steps until it's online. Built from the dashboard's
 * strings and Kumo fields; the password is plain text, never a password input,
 * so browsers don't offer to fill it.
 */
export function InstallScene({ icons }: { icons: AppIcons }) {
  const t = useTranslations("appstore")
  const tDetail = useTranslations("appboxmanager.appDetail")
  const sceneRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<"store" | "app">("store")
  const [dialog, setDialog] = useState(false)
  const [focus, setFocus] = useState<Field>(null)
  const [appbox, setAppbox] = useState(true)
  const [password, setPassword] = useState(12)
  const [pressed, setPressed] = useState<"store" | "dialog" | null>(null)
  const [step, setStep] = useState(0)
  const [online, setOnline] = useState(false)

  // The server's own job messages for an install, in order.
  const steps = [
    "Creating SSL certificate...",
    `Transferring ${APP} to your appbox...`,
    tDetail("configuringApp", { appName: APP })
  ]

  useSceneScript(sceneRef, async (sleep) => {
    const press = async (button: "store" | "dialog") => {
      setPressed(button)
      await sleep(160)
      setPressed(null)
    }
    for (;;) {
      setView("store")
      setDialog(false)
      setOnline(false)
      await sleep(900)
      await press("store")
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
      for (let length = 1; length <= 12; length++) {
        setPassword(length)
        await sleep(55)
      }
      await sleep(300)
      setFocus(null)
      await sleep(300)
      await press("dialog")
      setDialog(false)
      await sleep(200)
      setView("app")
      for (let i = 0; i < steps.length; i++) {
        setStep(i)
        await sleep(1300)
      }
      setOnline(true)
      await sleep(3600)
    }
  })

  return (
    <Stage width={580} height={520} sceneRef={sceneRef}>
      <div
        className="ks-abs ks-pagecard"
        style={{ left: 100, top: 96, width: 560 }}
      >
        {view === "store" ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <AppIcon
                icon={icons[APP] ?? ""}
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
                {t("app.install")}
              </Button>
              <p className="text-center text-kumo-subtle">
                Uses 1 app slot on your Appbox.
              </p>
            </div>
          </div>
        ) : (
          <div className="ks-in grid gap-4">
            <div className="flex items-center gap-4">
              <AppIcon
                icon={icons[APP] ?? ""}
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
                  <span className="font-mono text-[0.9em]">{DOMAIN}</span>
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
                <CustomFields
                  fields={CONFIGURATION}
                  onReveal={async () => undefined}
                />
              </div>
            ) : (
              <Banner
                icon={<InfoIcon weight="fill" />}
                title={tDetail("installing")}
                description={steps[step]}
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
            <h2 className="text-lg font-semibold">
              {t("app.installTitle", { name: APP })}
            </h2>
            <p className="text-kumo-subtle">
              {t("app.requiresSlots", { count: 1 })}
            </p>
            <XIcon
              size={16}
              className="absolute top-[22px] right-[22px] text-kumo-subtle"
            />
          </header>
          <div className="grid gap-5 px-6 py-5">
            <div className={cn(focus === "appbox" && "ks-focus")}>
              <Select
                label={t("app.selectCylo")}
                className="w-full"
                placeholder={t("app.selectCylo")}
                value={appbox ? "ada" : null}
                renderValue={() => (
                  <span className="flex items-baseline gap-1.5">
                    <span>ada</span>
                    <span className="text-kumo-subtle tabular-nums">
                      ({t("install.cyloSelector.slotsFree", { count: 5 })})
                    </span>
                  </span>
                )}
              >
                <Select.Option value="ada">ada</Select.Option>
              </Select>
            </div>
            <InputGroup
              label={withRequiredMark(t("install.domain.subdomain"), true)}
            >
              <InputGroup.Input
                aria-label={t("install.domain.subdomain")}
                value="nextcloud"
                readOnly
                autoComplete="off"
              />
              <InputGroup.Suffix>.ada.appboxes.co</InputGroup.Suffix>
            </InputGroup>
            <div className={cn(focus === "password" && "ks-focus")}>
              <InputGroup label={withRequiredMark(PASSWORD_LABEL, true)}>
                <InputGroup.Input
                  aria-label={PASSWORD_LABEL}
                  value={"•".repeat(password)}
                  readOnly
                  autoComplete="off"
                />
                <InputGroup.Addon align="end" className="pr-1">
                  <InputGroup.Button
                    shape="square"
                    icon={EyeIcon}
                    aria-label="Show password"
                  />
                </InputGroup.Addon>
              </InputGroup>
            </div>
          </div>
          <footer className="flex justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Button variant="secondary">{t("install.dialog.cancel")}</Button>
            <Button
              variant="primary"
              className={cn(pressed === "dialog" && "ks-press")}
            >
              {t("app.install")}
            </Button>
          </footer>
        </div>
      </div>
    </Stage>
  )
}
