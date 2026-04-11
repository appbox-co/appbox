"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, Eye, EyeOff, Package, Sparkles, Zap } from "lucide-react"
import type { CustomField } from "@/api/apps/app-store"
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
  placeholders?: Record<string, string>
  customFields?: Record<string, CustomField>
  appSlots?: number
  preinstallDescription?: string | null
  baseMemory?: number
  baseCpus?: number
}

function isRequired(field: CustomField): boolean {
  if (!field.validate) return false
  return field.validate.some((r) => r === "required")
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

function StaticBoostPreview({
  baseMemory,
  baseCpus,
  appSlotsCost
}: {
  baseMemory: number
  baseCpus: number
  appSlotsCost: number
}) {
  const boostSlots = 2
  const multiplier = 1 + boostSlots * 0.1
  const previewMemory = baseMemory * multiplier
  const previewCpus = baseCpus > 0 ? baseCpus * multiplier : 0
  const progress = 0.25

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          Per-App Boost
        </div>
        <div className="text-sm font-semibold tabular-nums">
          {boostSlots} / 8
        </div>
      </div>

      {/* Static slider visual */}
      <div className="relative py-2">
        <div className="relative h-2.5 w-full rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)"
            }}
          />
          {/* Notch dots */}
          {Array.from({ length: 9 }).map((_, i) => {
            const ratio = i / 8
            const filled = i <= boostSlots
            return (
              <div
                key={i}
                className={`absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${filled ? "border-white/70 bg-white/80" : "border-border bg-muted"}`}
                style={{ left: `${ratio * 100}%` }}
              />
            )
          })}
          {/* Thumb */}
          <div
            className="absolute top-1/2 z-20 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-background/60 shadow-[0_0_0_4px_rgba(99,102,241,0.18)] backdrop-blur-xs"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Zap className="size-3.5 text-amber-500" />
          Resource Preview
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Multiplier
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {multiplier.toFixed(1)}x
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Slot Cost
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {appSlotsCost + boostSlots}
              <span className="text-muted-foreground"> / 8</span>
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              RAM
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {previewMemory.toFixed(2)} GB
            </p>
          </div>
          <div className="rounded-md bg-background/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              CPUs
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {previewCpus > 0 ? previewCpus.toFixed(2) : "Shared"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InstallPreview({
  appName,
  placeholders,
  customFields,
  appSlots,
  preinstallDescription,
  baseMemory,
  baseCpus
}: InstallPreviewProps) {
  if (!customFields || Object.keys(customFields).length === 0) {
    if (!placeholders || Object.keys(placeholders).length === 0) return null
  }

  const visibleFields = customFields
    ? Object.entries(customFields).filter(
        ([, field]) => !SKIP_TYPES.has(field.type)
      )
    : []

  const hasRealFields = visibleFields.length > 0
  const slotCount = appSlots ?? 1
  const showBoost = (baseMemory ?? 0) > 0

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg"
      >
        <h2 className="text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-linear-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Install in seconds
          </span>
        </h2>
        <p className="mx-auto mb-8 mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
          Pick your Appbox, fill in a few fields, and {appName} is live.
        </p>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h3 className="text-lg font-semibold">Install {appName}</h3>
            <p className="text-sm text-muted-foreground">
              Requires {slotCount} App Slot{slotCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Appbox selector preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Appbox</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">My Appbox</span>
                  <span className="text-xs text-muted-foreground">
                    (8 slots free)
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Boost slider preview */}
            {showBoost && (
              <StaticBoostPreview
                baseMemory={baseMemory!}
                baseCpus={baseCpus!}
                appSlotsCost={slotCount}
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

          <div className="flex items-center justify-end gap-3 border-t bg-muted/10 px-6 py-4">
            <Button variant="outline" disabled className="pointer-events-none">
              Cancel
            </Button>
            <Button disabled className="pointer-events-none opacity-80">
              Install
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a preview of the install form. Sign up to deploy for real.
        </p>
      </motion.div>
    </section>
  )
}
