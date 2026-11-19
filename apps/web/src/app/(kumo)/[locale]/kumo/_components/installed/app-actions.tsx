"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Select } from "@cloudflare/kumo"
import {
  ArrowCircleUpIcon,
  ArrowClockwiseIcon,
  LightningIcon,
  PlayIcon,
  SnowflakeIcon,
  StopIcon,
  TrashIcon
} from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  failHandoffWindow,
  finishBrowserHandoff,
  openHandoffWindow
} from "@/api/custom-buttons/browser-handoff"
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
import { isLaunchWeekEnabled } from "@/config/launch-week-flags"
import { clearHiddenFieldValues, isFieldVisible } from "@/lib/dynamic-form"
import { useAuth } from "@/providers/auth-provider"
import { toFieldValue } from "../install/logic"
import { ActionDialog } from "./actions-dialog"
import { ActionFormField } from "./actions-field"
import {
  getVersionTimestamp,
  HIDDEN_BUTTON_FIELD_TYPES,
  mapButtonFieldToConfig,
  validateButtonField,
  type ButtonField
} from "./actions-logic"

/**
 * Text the current design has in English only, kept as it is there. The rest
 * of this file's text comes from the translations.
 */
const COPY = {
  cancel: "Cancel",
  confirm: "Confirm",
  run: "Run",
  updateQuestion: (name: string, from: string, to: string) =>
    `Update ${name} from version ${from} to ${to}?`,
  updateFailed: "Failed to update.",
  switchQuestion: (from: string, to: string) =>
    `Switch from version ${from} to ${to}?`,
  switchNothingSelected: "Select a version to switch to.",
  switchFailed: "Failed to switch version.",
  freezeFailed: "Failed to freeze.",
  unfreezeFailed: "Failed to unfreeze.",
  runQuestion: (label: string) => `Are you sure you want to run ${label}?`,
  popupsBlocked: "Allow pop-ups for Appbox."
} as const

interface AppActionsProps {
  app: InstalledApp
  startOnlyActionable?: boolean
}

/**
 * Everything that can be done to an installed app: power, update, version,
 * freeze, uninstall and the app's own buttons. A bare row of buttons, for the
 * page to place inside its "Actions" panel.
 */
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
  const customFieldValues = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(app.custom_fields ?? {}).map(([name, field]) => [
          name,
          field && typeof field === "object"
            ? String(field.defaultValue ?? "")
            : String(field ?? "")
        ])
      ),
    [app.custom_fields]
  )
  const visibleCustomButtons = useMemo(
    () =>
      customButtons.filter((button) =>
        isFieldVisible(
          { conditions: button.visibilityConditions ?? button.conditions },
          customFieldValues
        )
      ),
    [customButtons, customFieldValues]
  )

  const freezeEnabled = isLaunchWeekEnabled("day_5", isAdmin)
  const isFrozen = app.status === "frozen"
  const isRunning = app.status === "online"
  const isStopped = app.status === "offline" || app.status === "inactive"
  const isCyloRestarting = cylo?.status === "restarting"
  const isVmControlPending =
    app.vm_control_pending === true ||
    (app.windows_preshutdown_enabled === true &&
      (startMutation.isPending ||
        stopMutation.isPending ||
        restartMutation.isPending))
  const isTransitioning =
    isVmControlPending ||
    isCyloRestarting ||
    isFrozen ||
    app.status === "restarting" ||
    app.status === "installing" ||
    app.status === "updating" ||
    app.status === "deleting"
  const isRecoverableStopped = !app.enabled && app.state === 0

  const updateText = app.update_text?.trim()
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
  const currentVersion = (app.available_versions ?? []).find(
    (v) => v.version === app.version
  )
  const currentVersionTimestamp = getVersionTimestamp(currentVersion)
  const switchableVersions = (app.available_versions ?? []).filter((v) => {
    if (v.version === app.version) return false
    // Avoid showing the default update target in both places.
    if (hasUpdate && defaultVersion && v.version === defaultVersion)
      return false
    if (!app.allow_downgrade) {
      const targetVersionTimestamp = getVersionTimestamp(v)
      if (
        currentVersionTimestamp !== null &&
        targetVersionTimestamp !== null &&
        targetVersionTimestamp <= currentVersionTimestamp
      ) {
        return false
      }
    }
    return true
  })
  const showSwitcher = app.can_update && switchableVersions.length >= 1
  const selectedSwitchVersion = switchableVersions.find(
    (v) => String(v.id) === selectedSwitchVersionId
  )

  const handleUninstall = () => {
    if (isVmControlPending) return
    uninstallMutation.mutate(app.id, {
      onSuccess: () => {
        setUninstallOpen(false)
      }
    })
  }

  const updateNotes = updateText && (
    <p className="whitespace-pre-line text-kumo-default">{updateText}</p>
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {app.vm_control_pending && (
          <p role="status" className="w-full text-kumo-subtle">
            {t("vmControlPending")}
          </p>
        )}

        {/* Start */}
        <Button
          icon={PlayIcon}
          loading={startMutation.isPending}
          disabled={isRunning || isTransitioning || startMutation.isPending}
          onClick={() => startMutation.mutate(app.id)}
        >
          {t("start")}
        </Button>

        {/* Stop */}
        <Button
          icon={StopIcon}
          loading={stopMutation.isPending}
          disabled={
            startOnlyActionable ||
            isStopped ||
            isTransitioning ||
            stopMutation.isPending
          }
          onClick={() => stopMutation.mutate(app.id)}
        >
          {t("stop")}
        </Button>

        {/* Restart */}
        <Button
          icon={ArrowClockwiseIcon}
          loading={restartMutation.isPending}
          disabled={
            startOnlyActionable ||
            isStopped ||
            isTransitioning ||
            restartMutation.isPending
          }
          onClick={() => restartMutation.mutate(app.id)}
        >
          {t("restart")}
        </Button>

        {/* Update */}
        {hasUpdate && (
          <Button
            icon={ArrowCircleUpIcon}
            loading={updateMutation.isPending}
            disabled={
              startOnlyActionable ||
              isVmControlPending ||
              updateMutation.isPending
            }
            onClick={() => setUpdateConfirmOpen(true)}
          >
            {t("update")} ({defaultVersion})
          </Button>
        )}

        {/* Switch version: choosing one asks for confirmation */}
        {showSwitcher && (
          <Select
            aria-label={t("switchVersion")}
            placeholder={t("switchVersion")}
            className="w-56"
            // Kumo shows the placeholder for null; "" would count as a value.
            value={selectedSwitchVersionId || null}
            onValueChange={(val) => {
              if (val === null) return
              setSelectedSwitchVersionId(val)
              setSwitchConfirmOpen(true)
            }}
            renderValue={(val) =>
              switchableVersions.find((v) => String(v.id) === val)?.version ??
              null
            }
            disabled={
              startOnlyActionable ||
              isTransitioning ||
              switchVersionMutation.isPending
            }
          >
            {switchableVersions.map((v) => (
              <Select.Option key={v.id} value={String(v.id)}>
                <span className="tabular-nums">{v.version}</span>
              </Select.Option>
            ))}
          </Select>
        )}

        {/* Freeze / Unfreeze */}
        {freezeEnabled && !isFrozen && (
          <Button
            icon={SnowflakeIcon}
            loading={freezeMutation.isPending}
            disabled={
              (startOnlyActionable && !isStopped) ||
              isTransitioning ||
              freezeMutation.isPending
            }
            onClick={() => setFreezeConfirmOpen(true)}
          >
            {t("freeze")}
          </Button>
        )}
        {freezeEnabled && isFrozen && (
          <Button
            icon={PlayIcon}
            loading={unfreezeMutation.isPending}
            disabled={isVmControlPending || unfreezeMutation.isPending}
            onClick={() => setUnfreezeConfirmOpen(true)}
          >
            {t("unfreeze")}
          </Button>
        )}

        {/* Uninstall */}
        <Button
          variant="secondary-destructive"
          icon={TrashIcon}
          disabled={
            isVmControlPending || (startOnlyActionable && !isRecoverableStopped)
          }
          onClick={() => setUninstallOpen(true)}
        >
          {t("uninstall")}
        </Button>

        {/* Custom buttons — fetched from buttons/instance API */}
        {visibleCustomButtons.map((btn) => (
          <CustomButtonItem
            key={btn.id}
            button={btn}
            isTransitioning={isTransitioning || startOnlyActionable}
            isPending={triggerMutation.isPending && customConfirmId === btn.id}
            onConfirm={(payload) => {
              if (isVmControlPending) return
              let popup: Window | null = null
              if (btn.resultMode === "browser_handoff") {
                try {
                  popup = openHandoffWindow()
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : COPY.popupsBlocked
                  )
                  return
                }
              }
              setCustomConfirmId(btn.id)
              triggerMutation.mutate(
                { button: btn, payload },
                {
                  onSuccess: (admission) => {
                    if (popup && admission) {
                      void finishBrowserHandoff(popup, admission).catch(
                        (error: Error) => toast.error(error.message)
                      )
                    } else if (popup) {
                      failHandoffWindow(popup)
                    }
                  },
                  onError: () => {
                    if (popup) failHandoffWindow(popup)
                  },
                  onSettled: () => setCustomConfirmId(null)
                }
              )
            }}
          />
        ))}
      </div>

      {/* Update confirmation dialog */}
      <ActionDialog
        open={updateConfirmOpen}
        onOpenChange={setUpdateConfirmOpen}
        wide={Boolean(updateText)}
        title={t("update")}
        description={
          <>
            {updateNotes}
            {hasUpdate && defaultVersion && (
              <p>
                {COPY.updateQuestion(
                  app.display_name,
                  app.version,
                  defaultVersion
                )}
              </p>
            )}
          </>
        }
        error={
          updateMutation.isError
            ? (updateMutation.error?.message ?? COPY.updateFailed)
            : undefined
        }
        cancelLabel={COPY.cancel}
        cancelDisabled={updateMutation.isPending}
        onCancel={() => setUpdateConfirmOpen(false)}
        confirmLabel={COPY.confirm}
        confirmLoading={updateMutation.isPending}
        confirmDisabled={
          isVmControlPending || updateMutation.isPending || !updateVersionId
        }
        onConfirm={() => {
          if (isVmControlPending || !hasUpdate || !updateVersionId) return
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
      />

      {/* Freeze confirmation dialog */}
      <ActionDialog
        open={freezeConfirmOpen}
        onOpenChange={setFreezeConfirmOpen}
        title={`${t("freeze")} ${app.display_name}`}
        description={t("confirmFreeze")}
        error={
          freezeMutation.isError
            ? (freezeMutation.error?.message ?? COPY.freezeFailed)
            : undefined
        }
        cancelLabel={COPY.cancel}
        cancelDisabled={freezeMutation.isPending}
        onCancel={() => setFreezeConfirmOpen(false)}
        confirmLabel={COPY.confirm}
        confirmLoading={freezeMutation.isPending}
        confirmDisabled={isVmControlPending || freezeMutation.isPending}
        onConfirm={() => {
          if (isVmControlPending) return
          freezeMutation.mutate(app.id, {
            onSuccess: () => setFreezeConfirmOpen(false)
          })
        }}
      />

      {/* Unfreeze confirmation dialog */}
      <ActionDialog
        open={unfreezeConfirmOpen}
        onOpenChange={setUnfreezeConfirmOpen}
        title={`${t("unfreeze")} ${app.display_name}`}
        description={t("confirmUnfreeze")}
        error={
          unfreezeMutation.isError
            ? (unfreezeMutation.error?.message ?? COPY.unfreezeFailed)
            : undefined
        }
        cancelLabel={COPY.cancel}
        cancelDisabled={unfreezeMutation.isPending}
        onCancel={() => setUnfreezeConfirmOpen(false)}
        confirmLabel={COPY.confirm}
        confirmLoading={unfreezeMutation.isPending}
        confirmDisabled={isVmControlPending || unfreezeMutation.isPending}
        onConfirm={() => {
          if (isVmControlPending) return
          unfreezeMutation.mutate(app.id, {
            onSuccess: () => setUnfreezeConfirmOpen(false)
          })
        }}
      />

      {/* Uninstall confirmation dialog */}
      <ActionDialog
        alert
        open={uninstallOpen}
        onOpenChange={setUninstallOpen}
        title={`${t("uninstall")} ${app.display_name}`}
        description={t("confirmUninstall")}
        cancelLabel={COPY.cancel}
        cancelDisabled={uninstallMutation.isPending}
        onCancel={() => setUninstallOpen(false)}
        destructive
        confirmLabel={t("uninstall")}
        confirmLoading={uninstallMutation.isPending}
        confirmDisabled={isVmControlPending || uninstallMutation.isPending}
        onConfirm={handleUninstall}
      />

      {/* Switch version confirmation dialog */}
      <ActionDialog
        open={switchConfirmOpen}
        onOpenChange={setSwitchConfirmOpen}
        wide={Boolean(updateText)}
        title={t("switchVersion")}
        description={
          <>
            {updateNotes}
            <p>
              {selectedSwitchVersion
                ? COPY.switchQuestion(
                    app.version,
                    selectedSwitchVersion.version
                  )
                : COPY.switchNothingSelected}
            </p>
          </>
        }
        error={
          switchVersionMutation.isError
            ? switchVersionMutation.error?.message || COPY.switchFailed
            : undefined
        }
        cancelLabel={COPY.cancel}
        cancelDisabled={switchVersionMutation.isPending}
        onCancel={() => {
          setSwitchConfirmOpen(false)
          setSelectedSwitchVersionId("")
        }}
        confirmLabel={COPY.confirm}
        confirmLoading={switchVersionMutation.isPending}
        confirmDisabled={
          isVmControlPending ||
          !selectedSwitchVersionId ||
          switchVersionMutation.isPending
        }
        onConfirm={() => {
          if (isVmControlPending || !selectedSwitchVersionId) return
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
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom button item with its confirm dialog                                 */
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
  const visibleFormFields = useMemo(
    () => formFields.filter(([, field]) => isFieldVisible(field, fieldValues)),
    [formFields, fieldValues]
  )

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
    setFieldValues((prev) =>
      clearHiddenFieldValues(formFields, { ...prev, [name]: value })
    )
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
      visibleFormFields.forEach(([name, field]) => {
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
      visibleFormFields.forEach(([name, field]) => {
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
        className="max-w-full min-w-0"
        // The app's own colour marks the icon; the label keeps the text colour
        // so that it stays readable in both themes.
        icon={
          button.iconColor ? (
            <LightningIcon
              className="shrink-0"
              style={{ color: button.iconColor }}
            />
          ) : (
            LightningIcon
          )
        }
        loading={isPending}
        disabled={isTransitioning || isPending}
        onClick={openDialog}
      >
        <span className="truncate">{button.label}</span>
      </Button>

      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        wide={hasForm}
        title={button.dialogTitle ?? button.label}
        description={button.dialogText ?? COPY.runQuestion(button.label)}
        cancelLabel={COPY.cancel}
        onCancel={() => setOpen(false)}
        confirmLabel={COPY.run}
        onConfirm={handleConfirm}
      >
        {hasForm && (
          <div className="grid grid-cols-1 gap-5">
            {visibleFormFields.map(([name, field]) => (
              <ActionFormField
                key={name}
                config={mapButtonFieldToConfig(name, field)}
                value={fieldValues[name] ?? ""}
                error={fieldErrors[name]}
                onChange={(next) => handleFieldChange(name, toFieldValue(next))}
              />
            ))}
          </div>
        )}
      </ActionDialog>
    </>
  )
}
