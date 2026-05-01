"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Package,
  XCircle
} from "lucide-react"
import type { CustomField } from "@/api/apps/app-store"
import { BoostSlider } from "@/components/dashboard/boost-slider"
import {
  DeployDialog,
  type EligiblePlanOption
} from "@/components/marketing/deploy-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const SKIP_TYPES = new Set(["hidden", "spacer", "generatedPassword"])

const PASSWORD_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword"
])

interface InstallPreviewProps {
  appName: string
  appId: number | string
  placeholders?: Record<string, string>
  customFields?: Record<string, CustomField>
  appSlots?: number
  requiresDomain?: boolean
  domainPlaceholders?: {
    subdomain?: string | null
    appboxDomain?: string
    customDomain?: string
  }
  preinstallDescription?: string | null
  baseMemory?: number
  baseCpus?: number
  eligiblePlans?: EligiblePlanOption[]
  showHeader?: boolean
  showFooterNote?: boolean
  showAnnotations?: boolean
  deployEnabled?: boolean
  className?: string
}

function isRequired(field: CustomField): boolean {
  if (!field.validate) return false
  return field.validate.some((r) => r === "required")
}

function customFieldsUseDomain(customFields?: Record<string, CustomField>) {
  if (!customFields) return false

  return Object.entries(customFields).some(([name, field]) => {
    const defaultValue = String(field.defaultValue ?? "")
    return (
      field.type === "domain" ||
      name.toLowerCase().includes("domain") ||
      defaultValue.includes("%DOMAIN.")
    )
  })
}

function PreviewPasswordField({
  label,
  value,
  required
}: {
  label: string
  value: string
  required: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          readOnly
          value={visible ? value : ""}
          placeholder={visible ? undefined : value.replace(/./g, "\u2022")}
          type="text"
          className="pointer-events-none bg-muted/30 pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function PreviewSelectField({
  label,
  value,
  options,
  required
}: {
  label: string
  value: string
  options: Record<string, string>
  required: boolean
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Select value={value || Object.keys(options)[0]} disabled>
        <SelectTrigger className="pointer-events-none bg-muted/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PreviewTextField({
  label,
  value,
  required
}: {
  label: string
  value: string
  required: boolean
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        readOnly
        value={value}
        className="pointer-events-none bg-muted/30"
      />
    </div>
  )
}

function PreviewSwitchField({
  label,
  value
}: {
  label: string
  value: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">{label}</Label>
        <div
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${value ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`pointer-events-none inline-block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
          />
        </div>
      </div>
    </div>
  )
}

function getPreviewSubdomain(appName: string, value?: string | null) {
  const source = value || appName || "myapp"
  return (
    source
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "") || "myapp"
  )
}

type PreviewDomainType = "appbox" | "custom"

function PreviewDomainSection({
  appName,
  placeholders,
  domainType,
  onDomainTypeChange
}: {
  appName: string
  placeholders?: InstallPreviewProps["domainPlaceholders"]
  domainType: PreviewDomainType
  onDomainTypeChange: (type: PreviewDomainType) => void
}) {
  const tDomain = useTranslations("appstore.install.domain")
  const tPreviewDomain = useTranslations("site.install_preview.domain")
  const appboxSubdomain = getPreviewSubdomain(appName, placeholders?.subdomain)
  const appboxDomain = placeholders?.appboxDomain ?? "steve.appboxes.co"
  const customDomain = "toast.com"
  const customSubdomain = "steveloves"
  const fullAppboxDomain = `${appboxSubdomain}.${appboxDomain}`
  const fullCustomDomain = `${customSubdomain}.${customDomain}`
  const serverIp = "79.140.195.16"

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {tDomain("domainType")}
        </Label>
        <div className="flex w-fit gap-0.5 rounded-md border bg-muted/50 p-0.5">
          {(["appbox", "custom"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onDomainTypeChange(type)}
              className={`rounded px-3 py-1 text-sm font-medium transition-all ${
                domainType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "appbox"
                ? tDomain("typeAppbox")
                : tDomain("typeCustom")}
            </button>
          ))}
        </div>
      </div>

      {domainType === "appbox" ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {tDomain("subdomain")}
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-0">
            <Input
              readOnly
              value={appboxSubdomain}
              className="pointer-events-none z-10 rounded-r-none bg-muted/30"
            />
            <div className="flex h-9 items-center whitespace-nowrap rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
              .{appboxDomain}
            </div>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ {fullAppboxDomain}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tDomain("baseDomain")}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <div className="flex h-9 items-center justify-between rounded-md border bg-muted/30 px-3 text-sm">
              <span>{customDomain}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tDomain("subdomain")}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-0">
              <Input
                disabled
                value={customSubdomain}
                className="z-10 rounded-r-none disabled:cursor-default disabled:opacity-100"
              />
              <div className="flex h-9 items-center whitespace-nowrap rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                .{customDomain}
              </div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              ✓ {fullCustomDomain}
            </p>
          </div>

          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">
              {tDomain("dnsSetupTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {tDomain("dnsInstruction")}
            </p>

            <div className="space-y-1.5">
              <div className="grid grid-cols-[auto_1fr_auto] gap-1.5 px-1 font-mono text-xs text-muted-foreground">
                <span>{tPreviewDomain("recordType")}</span>
                <span>{tPreviewDomain("recordHost")}</span>
                <span>{tPreviewDomain("recordValue")}</span>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-md border bg-background px-3 py-2 font-mono text-sm">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                  A
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <span className="truncate font-medium">
                    {fullCustomDomain}
                  </span>
                  <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">{serverIp}</span>
                  <Copy className="size-3.5 text-muted-foreground" />
                </span>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>{tPreviewDomain("needHelp")}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-2 text-sm text-destructive">
              <XCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p>{tDomain("dnsNotPointing")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tDomain("dnsResolvedTo", { ip: "parking.toast.com." })}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              className="w-full disabled:cursor-default disabled:opacity-100"
            >
              {tDomain("retryVerify")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewBoostSlider({
  baseMemory,
  baseCpus,
  appSlotsCost
}: {
  baseMemory: number
  baseCpus: number
  appSlotsCost: number
}) {
  const t = useTranslations("appstore.install.boost")
  const [boostSlots, setBoostSlots] = useState(4)
  const cyloFreeSlots = 21
  const maxInstallBoostSlots = Math.max(0, cyloFreeSlots - appSlotsCost)

  return (
    <BoostSlider
      value={Math.min(boostSlots, maxInstallBoostSlots)}
      max={maxInstallBoostSlots}
      boostIncrement={0.1}
      maxBoostMultiplier={8}
      baseMemory={baseMemory}
      baseCpus={baseCpus}
      appSlotsCost={appSlotsCost}
      cyloFreeSlots={cyloFreeSlots}
      onChange={setBoostSlots}
      showUpgradeCta={false}
      labels={{
        title: t("title"),
        resourcePreview: t("resourcePreview"),
        multiplier: t("multiplier"),
        slotCost: t("slotCost"),
        ram: t("ram"),
        cpus: t("cpus")
      }}
    />
  )
}

function AnnotationCard({
  className,
  eyebrow,
  title,
  body,
  link
}: {
  className: string
  eyebrow: string
  title: string
  body: string
  link?: {
    href: string
    label: string
  }
}) {
  return (
    <div
      className={`pointer-events-auto absolute overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 text-left shadow-xl shadow-slate-200/60 backdrop-blur-md dark:border-white/10 dark:bg-[#070912] dark:shadow-black/30 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70 mask-[linear-gradient(180deg,black,rgba(0,0,0,0.84)_52%,transparent_88%)] dark:bg-[linear-gradient(rgba(255,255,255,0.056)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.056)_1px,transparent_1px)] dark:opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />
      <div className="relative mb-1 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </span>
      </div>
      <p className="relative text-sm font-semibold leading-snug text-slate-950 dark:text-white">
        {title}
      </p>
      <p className="relative mt-1 text-xs leading-relaxed text-slate-600 dark:text-white/60">
        {body}
      </p>
      {link && (
        <a
          href={link.href}
          className="relative mt-2 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {link.label}
        </a>
      )}
    </div>
  )
}

type AnnotationConnector = {
  start: [number, number]
  end: [number, number]
  bend?: number
}

function AnnotationConnectors({
  domainType,
  showBoost,
  showDomainPreview
}: {
  domainType: PreviewDomainType
  showBoost: boolean
  showDomainPreview: boolean
}) {
  const customDomain = domainType === "custom"
  const connectors: AnnotationConnector[] = [
    {
      start: [800, 124],
      end: [684, 166],
      bend: 22
    }
  ]

  if (showBoost) {
    connectors.push(
      {
        start: [114, 235],
        end: [374, 245],
        bend: -22
      },
      {
        start: [800, 348],
        end: [628, 395],
        bend: -20
      }
    )
  }

  if (showDomainPreview) {
    connectors.push(
      customDomain
        ? {
            start: [800, 690],
            end: [540, 600],
            bend: 20
          }
        : {
            start: [800, 574],
            end: [540, 525],
            bend: 20
          },
      customDomain
        ? {
            start: [224, 660],
            end: [430, 750],
            bend: -30
          }
        : {
            start: [224, 560],
            end: [414, 700],
            bend: -42
          }
    )
  }

  return (
    <svg
      className="absolute inset-0 size-full overflow-visible"
      fill="none"
      role="presentation"
    >
      {connectors.map(({ start, end, bend = 0 }, index) => {
        const midX = (start[0] + end[0]) / 2
        const controlY = (start[1] + end[1]) / 2 + bend
        const d = `M ${start[0]} ${start[1]} C ${midX} ${controlY}, ${midX} ${controlY}, ${end[0]} ${end[1]}`

        return (
          <g key={`${start.join("-")}-${end.join("-")}-${index}`}>
            <path
              d={d}
              stroke="hsl(var(--primary))"
              strokeOpacity="0.75"
              strokeWidth="1.25"
              strokeDasharray="6 8"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={end[0]}
              cy={end[1]}
              r="3"
              className="fill-background stroke-primary/70"
              strokeWidth="1.25"
            />
            <circle
              cx={end[0]}
              cy={end[1]}
              r="8"
              className="fill-primary/30"
            >
              <animate
                attributeName="r"
                values="5;10;5"
                dur="3s"
                begin={`${index * 0.18}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0;1"
                dur="3s"
                begin={`${index * 0.18}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )
      })}
    </svg>
  )
}

function PreviewAnnotationLayer({
  domainType,
  showBoost,
  showDomainPreview
}: {
  domainType: PreviewDomainType
  showBoost: boolean
  showDomainPreview: boolean
}) {
  const t = useTranslations("site.install_preview.annotations")
  const customDomain = domainType === "custom"

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
    >
      <AnnotationConnectors
        domainType={domainType}
        showBoost={showBoost}
        showDomainPreview={showDomainPreview}
      />

      <AnnotationCard
        className="right-0 top-[76px] w-56"
        eyebrow={t("select_appbox.eyebrow")}
        title={t("select_appbox.title")}
        body={t("select_appbox.body")}
      />

      {showBoost && (
        <>
          <AnnotationCard
            className="left-0 top-[136px] w-56"
            eyebrow={t("boost.eyebrow")}
            title={t("boost.title")}
            body={t("boost.body")}
            link={{
              href: "/?faq=resource_multipliers#faq",
              label: t("boost.link")
            }}
          />

          <AnnotationCard
            className="right-0 top-[286px] w-56"
            eyebrow={t("resource_preview.eyebrow")}
            title={t("resource_preview.title")}
            body={t("resource_preview.body")}
          />
        </>
      )}

      {showDomainPreview && (
        <>
          <AnnotationCard
            className={
              customDomain
                ? "right-0 top-[620px] w-56"
                : "right-0 top-[520px] w-56"
            }
            eyebrow={
              customDomain
                ? t("domains.custom.eyebrow")
                : t("domains.appbox.eyebrow")
            }
            title={
              customDomain
                ? t("domains.custom.title")
                : t("domains.appbox.title")
            }
            body={
              customDomain
                ? t("domains.custom.body")
                : t("domains.appbox.body")
            }
          />

          {customDomain ? (
            <>
              <AnnotationCard
                className="left-0 top-[596px] w-56"
                eyebrow={t("dns.eyebrow")}
                title={t("dns.title")}
                body={t("dns.body")}
              />
            </>
          ) : (
            <>
              <AnnotationCard
                className="left-0 top-[520px] w-56"
                eyebrow={t("configuration.eyebrow")}
                title={t("configuration.title")}
                body={t("configuration.body")}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

export function InstallPreview({
  appName,
  appId,
  placeholders,
  customFields,
  appSlots,
  requiresDomain = false,
  domainPlaceholders,
  preinstallDescription,
  baseMemory,
  baseCpus,
  eligiblePlans,
  showHeader = true,
  showFooterNote = true,
  showAnnotations = false,
  deployEnabled = true,
  className = "py-16"
}: InstallPreviewProps) {
  const t = useTranslations("site.install_preview")
  const [deployOpen, setDeployOpen] = useState(false)
  const [previewDomainType, setPreviewDomainType] =
    useState<PreviewDomainType>("appbox")

  const hasCustomFieldsConfig =
    !!customFields && Object.keys(customFields).length > 0
  const hasPlaceholders = !!placeholders && Object.keys(placeholders).length > 0
  const showDomainPreview = requiresDomain || customFieldsUseDomain(customFields)

  if (!hasCustomFieldsConfig && !hasPlaceholders && !showDomainPreview) {
    return null
  }

  const visibleFields = customFields
    ? Object.entries(customFields).filter(
        ([, field]) => !SKIP_TYPES.has(field.type)
      )
    : []

  const hasRealFields = visibleFields.length > 0
  const slotCount = appSlots ?? 1
  const showBoost = baseMemory != null && baseCpus != null

  return (
    <section className={className}>
      <div
        className={
          showAnnotations
            ? "relative mx-auto max-w-5xl"
            : "relative mx-auto max-w-lg"
        }
      >
        {showHeader && (
          <>
            <h2 className="text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="bg-linear-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                {t("headline")}
              </span>
            </h2>
            <p className="mx-auto mb-8 mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
              {t("description", { appName })}
            </p>
          </>
        )}

        {showAnnotations && (
          <PreviewAnnotationLayer
            domainType={previewDomainType}
            showBoost={showBoost}
            showDomainPreview={showDomainPreview}
          />
        )}

        <div className="relative z-10 mx-auto max-w-lg overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {t("dialog_title", { appName })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("requires_slots", { count: slotCount })}
                </p>
              </div>
              <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {t("preview_badge")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("demo_note")}
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Appbox selector preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("select_appbox")}
              </Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">steve</span>
                  <span className="text-xs text-muted-foreground">
                    {t("slots_free", { count: 21 })}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Boost slider preview */}
            {showBoost && (
              <PreviewBoostSlider
                baseMemory={baseMemory!}
                baseCpus={baseCpus!}
                appSlotsCost={slotCount}
              />
            )}

            {showDomainPreview && (
              <PreviewDomainSection
                appName={appName}
                placeholders={domainPlaceholders}
                domainType={previewDomainType}
                onDomainTypeChange={setPreviewDomainType}
              />
            )}

            {/* Preinstall description */}
            {preinstallDescription && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
                {preinstallDescription}
              </div>
            )}

            {/* Custom fields */}
            {hasRealFields
              ? visibleFields.map(([fname, field]) => {
                  const placeholder =
                    placeholders?.[fname] ?? String(field.defaultValue ?? "")
                  const required = isRequired(field)

                  if (PASSWORD_TYPES.has(field.type)) {
                    return (
                      <PreviewPasswordField
                        key={fname}
                        label={field.label}
                        value={placeholder || "SecurePass123!"}
                        required={required}
                      />
                    )
                  }

                  if (field.type === "selector" && field.params?.menuItems) {
                    return (
                      <PreviewSelectField
                        key={fname}
                        label={field.label}
                        value={placeholder}
                        options={
                          field.params.menuItems as Record<string, string>
                        }
                        required={required}
                      />
                    )
                  }

                  if (field.type === "switch") {
                    const isOn = placeholder === "1" || placeholder === "true"
                    return (
                      <PreviewSwitchField
                        key={fname}
                        label={field.label}
                        value={isOn}
                      />
                    )
                  }

                  if (
                    field.type === "staticText" ||
                    field.type === "clientURL" ||
                    field.type === "externalURL"
                  ) {
                    return null
                  }

                  return (
                    <PreviewTextField
                      key={fname}
                      label={field.label}
                      value={placeholder}
                      required={required}
                    />
                  )
                })
              : placeholders &&
                Object.entries(placeholders).map(([key, value]) => {
                  const isPassword =
                    key.toLowerCase().includes("password") ||
                    key.toLowerCase().includes("pass")
                  const label = key
                    .replace(/[_-]+/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())

                  if (isPassword) {
                    return (
                      <PreviewPasswordField
                        key={key}
                        label={label}
                        value={value}
                        required={true}
                      />
                    )
                  }

                  return (
                    <PreviewTextField
                      key={key}
                      label={label}
                      value={value}
                      required={false}
                    />
                  )
                })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/10 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              {t("ready_note")}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled
                className="pointer-events-none"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => deployEnabled && setDeployOpen(true)}
                disabled={!deployEnabled}
                className={deployEnabled ? undefined : "pointer-events-none"}
              >
                {t("install")}
              </Button>
            </div>
          </div>
        </div>

        {showFooterNote && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("footer_note")}
          </p>
        )}
      </div>

      {deployEnabled && (
        <DeployDialog
          appId={appId}
          open={deployOpen}
          onOpenChange={setDeployOpen}
          eligiblePlans={eligiblePlans}
        />
      )}
    </section>
  )
}
