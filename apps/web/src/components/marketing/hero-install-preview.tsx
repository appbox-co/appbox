"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  Calendar,
  CheckCircle2,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Layers,
  Loader2,
  MousePointer2,
  Package,
  Server
} from "lucide-react"
import type { AppDetails } from "@/api/appbox/hooks/use-app-details"
import type { CustomField } from "@/api/apps/app-store"
import { JobProgress } from "@/app/[locale]/(dashboard)/appboxmanager/installedapps/[id]/_components/app-alerts"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PreviewStep = "filling" | "clicking" | "installing" | "installed"

interface HeroInstallPreviewProps {
  app: AppDetails | null
}

const PREVIEW_STEPS: PreviewStep[] = [
  "filling",
  "clicking",
  "installing",
  "installed"
]
const CURSOR_BUTTON_TRAVEL_MS = 700
const BUTTON_CLICK_STEP_MS = 1400
const FORM_FILL_STEP_MS = 900
const INSTALLING_STEP_MS = 3000

const fieldValueHints: Record<string, string> = {
  OPENCLAW_GATEWAY_TOKEN: "oc_live_9Kf4...n7Qx",
  SSH_USERNAME: "appbox",
  SSH_HOST: "demo.appboxes.co",
  SSH_PORT: "22",
  SSH_COMMAND: "ssh -p 22 appbox@demo.appboxes.co",
  LOGIN_URL: "https://openclaw.appboxes.co"
}

const previewFieldLabels: Record<string, string> = {
  OPENCLAW_GATEWAY_TOKEN: "OpenClaw Gateway Token",
  SSH_COMMAND: "SSH Command",
  LOGIN_URL: "Login URL"
}

const previewFieldTypes: Record<string, string> = {
  OPENCLAW_GATEWAY_TOKEN: "password",
  LOGIN_URL: "clientURL"
}

function getIconUrl(iconImage?: string) {
  if (!iconImage) {
    return "https://api.appbox.co/assets/images/apps/placeholder.png"
  }

  if (iconImage.startsWith("http")) {
    return iconImage
  }

  return `https://api.appbox.co/assets/images/apps/icons/${iconImage}`
}

function getPreviewFieldLabel(name: string) {
  if (previewFieldLabels[name]) {
    return previewFieldLabels[name]
  }

  return name
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getMarketingPreviewFields(app: AppDetails | null) {
  const metaBlock = Array.isArray(app?.marketing_content)
    ? app.marketing_content.find((block) => block.type === "meta")
    : undefined
  const installPreview =
    metaBlock?.type === "meta" ? metaBlock.install_preview : undefined

  if (!installPreview || Object.keys(installPreview).length === 0) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(installPreview).map(([name, value]) => {
      const field: CustomField = {
        label: getPreviewFieldLabel(name),
        type: previewFieldTypes[name] ?? "dynamicText",
        width: 12,
        defaultValue: value
      }

      return [name, field]
    })
  )
}

function getPreviewCustomFields(app: AppDetails | null) {
  if (app?.customFields && Object.keys(app.customFields).length > 0) {
    return app.customFields
  }

  return getMarketingPreviewFields(app)
}

function getFieldValue(name: string, field: CustomField) {
  const defaultValue = fieldValueHints[name] ?? field.defaultValue

  if (defaultValue != null && String(defaultValue).trim()) {
    return String(defaultValue)
  }

  return "configured automatically"
}

function getInstallFields(customFields?: Record<string, CustomField>) {
  return Object.entries(customFields ?? {})
    .filter(
      ([, field]) => !["hidden", "spacer", "staticText"].includes(field.type)
    )
    .slice(0, 4)
}

function getInstalledFields(customFields?: Record<string, CustomField>) {
  return Object.entries(customFields ?? {})
    .filter(([, field]) => !["spacer", "staticText"].includes(field.type))
    .slice(0, 6)
}

function PreviewFieldValue({
  name,
  field
}: {
  name: string
  field: CustomField
}) {
  return (
    <div className="relative min-w-0 rounded-md bg-muted/50 px-3 py-2">
      <p className="truncate text-[10px] font-medium text-muted-foreground">
        {field.label}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="min-w-0 flex-1 truncate text-xs font-medium">
          {getFieldValue(name, field)}
        </p>
        {field.type === "externalURL" || field.type === "clientURL" ? (
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <Copy className="size-3 shrink-0 text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

function PreviewAppIcon({
  iconUrl,
  appName,
  className
}: {
  iconUrl: string
  appName: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/50",
        className
      )}
    >
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt={appName}
          fill
          sizes="80px"
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package className="size-8 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function HeroInstallPreview({ app }: HeroInstallPreviewProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [cursorOnButton, setCursorOnButton] = useState(false)
  const step = PREVIEW_STEPS[stepIndex]

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        setCursorOnButton(false)
        setStepIndex((current) => (current + 1) % PREVIEW_STEPS.length)
      },
      step === "installing"
        ? INSTALLING_STEP_MS
        : step === "clicking"
          ? BUTTON_CLICK_STEP_MS
          : step === "filling"
            ? FORM_FILL_STEP_MS
            : 2300
    )

    return () => window.clearTimeout(timeout)
  }, [step])

  useEffect(() => {
    if (step !== "clicking") {
      return
    }

    const timeout = window.setTimeout(
      () => setCursorOnButton(true),
      CURSOR_BUTTON_TRAVEL_MS
    )

    return () => window.clearTimeout(timeout)
  }, [step])

  const customFields = useMemo(() => getPreviewCustomFields(app), [app])
  const installFields = useMemo(
    () => getInstallFields(customFields),
    [customFields]
  )
  const installedFields = useMemo(
    () => getInstalledFields(customFields),
    [customFields]
  )
  const appName = app?.display_name ?? "OpenClaw"
  const appVersion = app?.version ?? "latest"
  const iconUrl = getIconUrl(app?.icon_image)
  const slotCount = app?.app_slots ?? 2
  const customFieldDescription =
    app?.custom_field_preinstall_description ??
    "OpenClaw needs these connection details before Appbox starts the install."
  const showInstalledPage = step === "installing" || step === "installed"

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto hidden aspect-square w-full max-w-[540px] overflow-hidden rounded-2xl border bg-muted/30 text-foreground shadow-2xl shadow-blue-100/70 min-[1036px]:block dark:border-white/10 dark:bg-background dark:shadow-indigo-950/30"
    >
      <div className="relative flex size-full flex-col overflow-hidden">
        <div className="flex h-9 shrink-0 items-center justify-between border-b bg-muted/30 px-3 dark:border-white/10">
          <div className="truncate text-[11px] font-medium text-muted-foreground">
            appbox.co
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-rose-400" />
          </div>
        </div>

        {!showInstalledPage ? (
          <div className="relative m-auto flex max-h-[85%] w-[82%] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3 text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold leading-none tracking-tight">
                    Install {appName}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Requires {slotCount} app slots
                  </p>
                </div>
                <PreviewAppIcon
                  iconUrl={iconUrl}
                  appName={appName}
                  className="size-10"
                />
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-hidden px-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Select Appbox</Label>
                <div className="flex h-8 w-full items-center justify-between rounded-md border bg-muted/30 px-2.5 py-2 text-xs shadow-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <Package className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">steve</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {slotCount} slots
                    <ChevronsUpDown className="size-3.5 opacity-50" />
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Select Version</Label>
                <div className="flex h-8 w-full items-center justify-between rounded-md border bg-muted/30 px-2.5 py-2 text-xs shadow-xs">
                  <span className="flex items-center gap-2">
                    <span>{appVersion}</span>
                    <span className="text-[10px] text-primary">Default</span>
                  </span>
                  <ChevronsUpDown className="size-3.5 opacity-50" />
                </div>
              </div>

              <div className="rounded-md border bg-muted/50 p-2.5 text-[10px] leading-4 text-muted-foreground">
                {customFieldDescription}
              </div>

              {installFields.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {installFields.map(([name, field], index) => (
                    <div
                      key={name}
                      className={cn(index > 1 && "hidden xl:block")}
                    >
                      <Label className="mb-1 block truncate text-[10px] font-medium text-muted-foreground">
                        {field.label}
                      </Label>
                      <div
                        className={cn(
                          "flex h-7 items-center truncate rounded-md border bg-muted/30 px-2.5 text-[10px] shadow-xs transition-colors",
                          step === "filling" &&
                            index === 0 &&
                            "border-primary/50 ring-1 ring-primary/20"
                        )}
                      >
                        {getFieldValue(name, field)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t bg-muted/10 px-4 py-3 sm:flex-row sm:justify-end sm:space-x-2">
              <div className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium shadow-xs">
                Cancel
              </div>
              <div
                className={cn(
                  "relative inline-flex h-8 min-w-28 items-center justify-center rounded-md bg-foreground px-3 text-xs font-medium text-background shadow-sm transition-all",
                  cursorOnButton && "scale-95 bg-foreground/85"
                )}
              >
                Install
              </div>
            </div>

            <div
              className={cn(
                "absolute z-10 text-slate-950 transition-all duration-700",
                step === "filling" && "left-[58%] top-[64%]",
                step === "clicking" && "left-[81%] top-[88%]",
                cursorOnButton && "scale-90"
              )}
            >
              {cursorOnButton && (
                <>
                  <span className="absolute -left-4 -top-4 size-10 animate-ping rounded-full border border-primary/40" />
                  <span className="absolute -left-2.5 -top-2.5 size-7 animate-ping rounded-full bg-primary/15 [animation-delay:120ms]" />
                  <span className="absolute -left-5 -top-5 size-12 rounded-full bg-[radial-gradient(circle,--theme(--color-primary/0.22)_0%,--theme(--color-primary/0.12)_35%,transparent_70%)]" />
                </>
              )}
              <MousePointer2
                className="relative z-10 size-6 fill-slate-950 text-white drop-shadow-[0_4px_10px_rgba(15,23,42,0.35)]"
                strokeWidth={2.5}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
            <div className="flex items-start gap-3">
              <PreviewAppIcon
                iconUrl={iconUrl}
                appName={appName}
                className="size-14"
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-xl font-bold">{appName}</h2>
                  {step === "installed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-300">
                      <Loader2 className="size-3 animate-spin" />
                      Installing
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{appVersion}</p>
              </div>
            </div>

            {step === "installing" && (
              <div className="relative mt-4 h-28 shrink-0 overflow-hidden rounded-md">
                <JobProgress
                  job={{
                    job_id: 1,
                    cylo_id: 1,
                    instance_id: app?.id ?? 0,
                    status: `Installing ${appName}`
                  }}
                  color="#3b82f6"
                />
                <div className="relative z-10 flex items-start gap-3 px-3 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/50">
                    <Package className="size-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Installing
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-gray-700 dark:text-white/70">
                      Configuring {appName} on steve...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                [Package, "Version", appVersion],
                [Calendar, "Installed", "Today"],
                [Layers, "Appbox", "steve"],
                [Server, "Server", "eu-01"]
              ].map(([Icon, label, value]) => {
                const CardIcon = Icon as typeof Package
                return (
                  <div
                    key={label as string}
                    className="rounded-md border bg-card p-2 shadow-sm"
                  >
                    <CardIcon className="size-3.5 text-muted-foreground" />
                    <p className="mt-1 truncate text-[9px] text-muted-foreground">
                      {label as string}
                    </p>
                    <p className="truncate text-[10px] font-semibold">
                      {value as string}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 min-h-0 overflow-hidden rounded-md border bg-card shadow-sm">
              <div className="border-b px-3 py-2.5">
                <p className="text-xs font-semibold leading-none tracking-tight">
                  Custom fields
                </p>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {installedFields.map(([name, field]) => (
                  <PreviewFieldValue key={name} name={name} field={field} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
