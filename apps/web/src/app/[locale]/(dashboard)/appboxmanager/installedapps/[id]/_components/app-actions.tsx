"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  ArrowUpCircle,
  Loader2,
  Play,
  RotateCcw,
  Snowflake,
  Square,
  Trash2,
  Zap
} from "lucide-react"
import type { ControllerRenderProps, FieldValues } from "react-hook-form"
import type { CustomButton } from "@/api/custom-buttons/custom-buttons"
import {
  useCustomButtons,
  useTriggerCustomButton
} from "@/api/custom-buttons/hooks/use-custom-buttons"
import { useCylo } from "@/api/cylos/hooks/use-cylos"
import {
  useFreezeApp,
  useRestartApp,
  useStartApp,
  useStopApp,
  useSwitchVersion,
  useUnfreezeApp,
  useUninstallApp,
  useUpdateApp
} from "@/api/installed-apps/hooks/use-installed-apps"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import { FormFieldRenderer } from "@/components/dashboard/dynamic-form/form-field-renderer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { useAuth } from "@/providers/auth-provider"
import type { FormFieldConfig } from "@/types/dashboard"

interface AppActionsProps {
  app: InstalledApp
  startOnlyActionable?: boolean
}

type ButtonFieldValidation =
  | string
  | {
      name?: string
      params?: Record<string, unknown>
      minLength?: number
      maxLength?: number
    }

type ButtonField = {
  label: string
  type: string
  width?: number
  defaultValue?: string | number | boolean
  validate?: ButtonFieldValidation[]
  params?: {
    menuItems?: Record<string, string>
    regex?: string
    errorText?: string
    [key: string]: unknown
  }
}

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>
) => string

const HIDDEN_BUTTON_FIELD_TYPES = new Set([
  "hidden",
  "spacer",
  "generatedPassword"
])
const PASSWORD_BUTTON_FIELD_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword"
])

function isButtonFieldRequired(field: ButtonField): boolean {
  if (!field.validate) return false
  return field.validate.some((r) => r === "required")
}

function mapButtonFieldToConfig(
  name: string,
  field: ButtonField
): FormFieldConfig {
  const required = isButtonFieldRequired(field)
  const base = {
    name,
    label: field.label,
    required
  }

  if (field.type === "selector") {
    const menuItems = field.params?.menuItems
    return {
      ...base,
      type: "select",
      options: menuItems
        ? Object.entries(menuItems).map(([value, label]) => ({ value, label }))
        : []
    }
  }

  if (field.type === "switch") {
    return { ...base, type: "toggle" }
  }

  if (field.type === "textArea") {
    return { ...base, type: "textarea" }
  }

  if (PASSWORD_BUTTON_FIELD_TYPES.has(field.type)) {
    return { ...base, type: "password" }
  }

  if (field.type === "email") return { ...base, type: "email" }
  if (field.type === "number") return { ...base, type: "number" }

  // Fallback for dynamicText/search/date/staticText and unknown text-like fields.
  return { ...base, type: "text" }
}

function validateButtonField(
  value: string,
  field: ButtonField,
  t: TranslateFn
): string | null {
  const rules = field.validate
  if (!rules || rules.length === 0) return null

  for (const rule of rules) {
    if (typeof rule === "string") {
      switch (rule) {
        case "required":
          if (!value || value.trim() === "")
            return t("customButtonValidation.required")
          break
        case "alphanumeric":
          if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
            return t("customButtonValidation.alphanumeric")
          }
          break
        case "notOnlyAlpha":
          if (value && /^[a-zA-Z]+$/.test(value)) {
            return t("customButtonValidation.notOnlyAlpha")
          }
          break
        case "complexPassword":
          if (value) {
            if (!/[a-z]/.test(value))
              return t("customButtonValidation.lowercase")
            if (!/[A-Z]/.test(value))
              return t("customButtonValidation.uppercase")
            if (!/[0-9]/.test(value)) return t("customButtonValidation.number")
            if (!/[^a-zA-Z0-9]/.test(value)) {
              return t("customButtonValidation.specialChar")
            }
          }
          break
        case "email":
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return t("customButtonValidation.invalidEmail")
          }
          break
        case "date":
          if (value && isNaN(Date.parse(value)))
            return t("customButtonValidation.invalidDate")
          break
        case "domain":
        case "depends":
          break
      }
    } else if (typeof rule === "object") {
      if (rule.minLength != null && value.length < rule.minLength) {
        return t("customButtonValidation.minLength", { count: rule.minLength })
      }
      if (rule.maxLength != null && value.length > rule.maxLength) {
        return t("customButtonValidation.maxLength", { count: rule.maxLength })
      }
      if (rule.name === "matches" && rule.params) {
        const regex = rule.params.regex as string | undefined
        const errorText =
          (rule.params.errorText as string | undefined) ??
          t("customButtonValidation.invalidFormat")
        if (regex && value) {
          try {
            if (!new RegExp(regex).test(value)) return errorText
          } catch {
            // Ignore invalid backend regex and allow submission.
          }
        }
      }
    }
  }

  return null
}

export function AppActions({
  app,
  startOnlyActionable = false
}: AppActionsProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const { isAdmin } = useAuth()
  const { data: cylo } = useCylo(app.cylo_id)
  const [uninstallOpen, setUninstallOpen] = useState(false)
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false)
  const [freezeConfirmOpen, setFreezeConfirmOpen] = useState(false)
  const [unfreezeConfirmOpen, setUnfreezeConfirmOpen] = useState(false)
  const [customConfirmId, setCustomConfirmId] = useState<number | null>(null)
  const [selectedSwitchVersionId, setSelectedSwitchVersionId] = useState("")
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false)

  const startMutation = useStartApp()
  const stopMutation = useStopApp()
  const restartMutation = useRestartApp()
  const updateMutation = useUpdateApp()
  const uninstallMutation = useUninstallApp()
  const switchVersionMutation = useSwitchVersion()
  const freezeMutation = useFreezeApp()
  const unfreezeMutation = useUnfreezeApp()
  const triggerMutation = useTriggerCustomButton()

  const { data: customButtons = [] } = useCustomButtons(app.id)

  const freezeEnabled = isLaunchWeekEnabled("day_5", isAdmin)
  const isFrozen = app.status === "frozen"
  const isRunning = app.status === "online"
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isCyloRestarting = cylo?.status === "restarting"
  const isTransitioning =
    isCyloRestarting ||
    isFrozen ||
    app.status === "restarting" ||
    app.status === "installing" ||
    app.status === "updating" ||
    app.status === "deleting"
  const isRecoverableStopped = !app.enabled && app.state === 0

  const defaultVersion = app.default_version?.trim()
  const updateTargetVersion = (app.available_versions ?? []).find(
    (v) => v.version === defaultVersion
  )
  const updateVersionId =
    updateTargetVersion?.id ?? app.available_versions?.[0]?.id
  const hasUpdate =
    app.can_update &&
    !!defaultVersion &&
    defaultVersion.length > 0 &&
    defaultVersion !== app.version
  const switchableVersions = (app.available_versions ?? []).filter((v) => {
    if (v.version === app.version) return false
    // Avoid showing the default update target in both places.
    if (hasUpdate && defaultVersion && v.version === defaultVersion)
      return false
    return true
  })
  const showSwitcher = app.can_update && switchableVersions.length >= 1
  const selectedSwitchVersion = switchableVersions.find(
    (v) => String(v.id) === selectedSwitchVersionId
  )

  const handleUninstall = () => {
    uninstallMutation.mutate(app.id, {
      onSuccess: () => {
        setUninstallOpen(false)
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Start */}
        <Button
          variant="outline"
          size="sm"
          disabled={isRunning || isTransitioning || startMutation.isPending}
          onClick={() => startMutation.mutate(app.id)}
        >
          {startMutation.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Play className="mr-1.5 size-4" />
          )}
          {t("start")}
        </Button>

        {/* Stop */}
        <Button
          variant="outline"
          size="sm"
          disabled={
            startOnlyActionable ||
            isStopped ||
            isTransitioning ||
            stopMutation.isPending
          }
          onClick={() => stopMutation.mutate(app.id)}
        >
          {stopMutation.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Square className="mr-1.5 size-4" />
          )}
          {t("stop")}
        </Button>

        {/* Restart */}
        <Button
          variant="outline"
          size="sm"
          disabled={
            startOnlyActionable ||
            isStopped ||
            isTransitioning ||
            restartMutation.isPending
          }
          onClick={() => restartMutation.mutate(app.id)}
        >
          {restartMutation.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-1.5 size-4" />
          )}
          {t("restart")}
        </Button>

        {/* Update */}
        {hasUpdate && (
          <Button
            variant="outline"
            size="sm"
            disabled={startOnlyActionable || updateMutation.isPending}
            onClick={() => setUpdateConfirmOpen(true)}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="mr-1.5 size-4" />
            )}
            {t("update")} ({defaultVersion})
          </Button>
        )}

        {showSwitcher && (
          <>
            <Select
              value={selectedSwitchVersionId}
              onValueChange={(val) => {
                setSelectedSwitchVersionId(val)
                setSwitchConfirmOpen(true)
              }}
              disabled={
                startOnlyActionable ||
                isTransitioning ||
                switchVersionMutation.isPending
              }
            >
              <SelectTrigger className="h-8 w-[220px] text-xs">
                <SelectValue placeholder={t("switchVersion")} />
              </SelectTrigger>
              <SelectContent>
                {switchableVersions.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Freeze / Unfreeze */}
        {freezeEnabled && !isFrozen && (
          <Button
            variant="outline"
            size="sm"
            disabled={
              (startOnlyActionable && !isStopped) ||
              isTransitioning ||
              freezeMutation.isPending
            }
            onClick={() => setFreezeConfirmOpen(true)}
          >
            {freezeMutation.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Snowflake className="mr-1.5 size-4" />
            )}
            {t("freeze")}
          </Button>
        )}
        {freezeEnabled && isFrozen && (
          <Button
            variant="outline"
            size="sm"
            disabled={unfreezeMutation.isPending}
            onClick={() => setUnfreezeConfirmOpen(true)}
          >
            {unfreezeMutation.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-4" />
            )}
            {t("unfreeze")}
          </Button>
        )}

        {/* Uninstall */}
        <Button
          variant="destructive"
          size="sm"
          disabled={startOnlyActionable && !isRecoverableStopped}
          onClick={() => setUninstallOpen(true)}
        >
          <Trash2 className="mr-1.5 size-4" />
          {t("uninstall")}
        </Button>

        {/* Custom buttons — fetched from buttons/instance API */}
        {customButtons.map((btn) => (
          <CustomButtonItem
            key={btn.id}
            button={btn}
            isTransitioning={isTransitioning || startOnlyActionable}
            isPending={triggerMutation.isPending && customConfirmId === btn.id}
            onConfirm={(payload) => {
              setCustomConfirmId(btn.id)
              triggerMutation.mutate(
                { button: btn, payload },
                {
                  onSettled: () => setCustomConfirmId(null)
                }
              )
            }}
          />
        ))}
      </div>

      {/* Update confirmation dialog */}
      <Dialog open={updateConfirmOpen} onOpenChange={setUpdateConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("update")}</DialogTitle>
            <DialogDescription>
              {hasUpdate && defaultVersion
                ? `Update ${app.display_name} from version ${app.version} to ${defaultVersion}?`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              {updateMutation.error?.message ?? "Failed to update."}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateConfirmOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!hasUpdate || !updateVersionId) return
                updateMutation.mutate(
                  {
                    id: app.id,
                    // Backend uses default version for this endpoint, but pass
                    // matching version id when available for consistency.
                    versionId: updateVersionId
                  },
                  {
                    onSuccess: () => setUpdateConfirmOpen(false)
                  }
                )
              }}
              disabled={updateMutation.isPending || !updateVersionId}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze confirmation dialog */}
      <Dialog open={freezeConfirmOpen} onOpenChange={setFreezeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("freeze")} {app.display_name}
            </DialogTitle>
            <DialogDescription>{t("confirmFreeze")}</DialogDescription>
          </DialogHeader>
          {freezeMutation.isError && (
            <p className="text-sm text-destructive">
              {freezeMutation.error?.message ?? "Failed to freeze."}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFreezeConfirmOpen(false)}
              disabled={freezeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                freezeMutation.mutate(app.id, {
                  onSuccess: () => setFreezeConfirmOpen(false)
                })
              }}
              disabled={freezeMutation.isPending}
            >
              {freezeMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unfreeze confirmation dialog */}
      <Dialog open={unfreezeConfirmOpen} onOpenChange={setUnfreezeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("unfreeze")} {app.display_name}
            </DialogTitle>
            <DialogDescription>{t("confirmUnfreeze")}</DialogDescription>
          </DialogHeader>
          {unfreezeMutation.isError && (
            <p className="text-sm text-destructive">
              {unfreezeMutation.error?.message ?? "Failed to unfreeze."}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnfreezeConfirmOpen(false)}
              disabled={unfreezeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                unfreezeMutation.mutate(app.id, {
                  onSuccess: () => setUnfreezeConfirmOpen(false)
                })
              }}
              disabled={unfreezeMutation.isPending}
            >
              {unfreezeMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Uninstall confirmation dialog */}
      <Dialog open={uninstallOpen} onOpenChange={setUninstallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("uninstall")} {app.display_name}
            </DialogTitle>
            <DialogDescription>{t("confirmUninstall")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUninstallOpen(false)}
              disabled={uninstallMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUninstall}
              disabled={uninstallMutation.isPending}
            >
              {uninstallMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("uninstall")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={switchConfirmOpen} onOpenChange={setSwitchConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("switchVersion")}</DialogTitle>
            <DialogDescription>
              {selectedSwitchVersion
                ? `Switch from version ${app.version} to ${selectedSwitchVersion.version}?`
                : "Select a version to switch to."}
            </DialogDescription>
          </DialogHeader>
          {switchVersionMutation.isError && (
            <p className="text-sm text-destructive">
              {switchVersionMutation.error?.message ||
                "Failed to switch version."}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSwitchConfirmOpen(false)
                setSelectedSwitchVersionId("")
              }}
              disabled={switchVersionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedSwitchVersionId) return
                switchVersionMutation.mutate(
                  {
                    id: app.id,
                    versionId: Number(selectedSwitchVersionId)
                  },
                  {
                    onSuccess: () => {
                      setSwitchConfirmOpen(false)
                      setSelectedSwitchVersionId("")
                    }
                  }
                )
              }}
              disabled={
                !selectedSwitchVersionId || switchVersionMutation.isPending
              }
            >
              {switchVersionMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom button item with inline confirm dialog                             */
/* -------------------------------------------------------------------------- */

function CustomButtonItem({
  button,
  isTransitioning,
  isPending,
  onConfirm
}: {
  button: CustomButton
  isTransitioning: boolean
  isPending: boolean
  onConfirm: (payload?: Record<string, unknown>) => void
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const [open, setOpen] = useState(false)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const formFields = useMemo(() => {
    const fields = button.inputForm?.fields
    if (!fields || typeof fields !== "object") return []
    return Object.entries(fields).filter(([, field]) => {
      return (
        !!field &&
        typeof field === "object" &&
        !HIDDEN_BUTTON_FIELD_TYPES.has(field.type)
      )
    }) as Array<[string, ButtonField]>
  }, [button.inputForm?.fields])

  const hasForm = formFields.length > 0

  const openDialog = () => {
    if (hasForm) {
      const nextValues: Record<string, string> = {}
      formFields.forEach(([name, field]) => {
        const defaultValue = field.defaultValue
        if (typeof defaultValue === "boolean") {
          nextValues[name] = defaultValue ? "1" : "0"
        } else if (defaultValue == null) {
          nextValues[name] = ""
        } else {
          nextValues[name] = String(defaultValue)
        }
      })
      setFieldValues(nextValues)
      setFieldErrors({})
    }
    setOpen(true)
  }

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleConfirm = () => {
    if (hasForm) {
      const errors: Record<string, string> = {}
      formFields.forEach(([name, field]) => {
        const value = fieldValues[name] ?? ""
        const error = validateButtonField(value, field, t)
        if (error) errors[name] = error
      })
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
    }

    const payload: Record<string, unknown> = {}
    if (hasForm) {
      formFields.forEach(([name, field]) => {
        const raw = fieldValues[name] ?? ""
        if (field.type === "number") {
          payload[name] = raw === "" ? null : Number(raw)
        } else if (field.type === "switch") {
          payload[name] = raw === "1" || raw === "true" ? 1 : 0
        } else {
          payload[name] = raw
        }
      })
    }

    setOpen(false)
    onConfirm(hasForm ? payload : undefined)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isTransitioning || isPending}
        onClick={openDialog}
        style={
          button.iconColor
            ? {
                borderColor: `${button.iconColor}60`,
                color: button.iconColor
              }
            : undefined
        }
      >
        {isPending ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Zap
            className="mr-1.5 size-4"
            style={button.iconColor ? { color: button.iconColor } : undefined}
          />
        )}
        {button.label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{button.dialogTitle ?? button.label}</DialogTitle>
            <DialogDescription>
              {button.dialogText ??
                `Are you sure you want to run ${button.label}?`}
            </DialogDescription>
          </DialogHeader>
          {hasForm && (
            <div className="space-y-4">
              {formFields.map(([name, field]) => {
                const config = mapButtonFieldToConfig(name, field)
                const controllerField = {
                  name,
                  value: fieldValues[name] ?? "",
                  onBlur: () => undefined,
                  ref: () => undefined,
                  onChange: (
                    next:
                      | string
                      | number
                      | boolean
                      | { target?: { value?: unknown } }
                      | undefined
                  ) => {
                    if (typeof next === "string" || typeof next === "number") {
                      handleFieldChange(name, String(next))
                      return
                    }
                    if (typeof next === "boolean") {
                      handleFieldChange(name, next ? "1" : "0")
                      return
                    }
                    const targetValue = next?.target?.value
                    if (
                      typeof targetValue === "string" ||
                      typeof targetValue === "number"
                    ) {
                      handleFieldChange(name, String(targetValue))
                      return
                    }
                    handleFieldChange(name, "")
                  }
                } as unknown as ControllerRenderProps<FieldValues, string>

                return (
                  <FormFieldRenderer
                    key={name}
                    config={config}
                    field={controllerField}
                    error={fieldErrors[name]}
                  />
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
