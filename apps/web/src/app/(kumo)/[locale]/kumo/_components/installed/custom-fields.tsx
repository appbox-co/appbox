"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Link as KumoLink, Tooltip } from "@cloudflare/kumo"
import {
  ArrowSquareOutIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeSlashIcon
} from "@phosphor-icons/react"
import type { CustomField } from "@/api/apps/app-store"
import { isFieldVisible } from "@/lib/dynamic-form"
import { Panel } from "../panel"

/* -------------------------------------------------------------------------- */
/*  Field rules, unchanged from the current design                             */
/* -------------------------------------------------------------------------- */

const HIDDEN_TYPES = new Set(["hidden", "spacer"])
const PASSWORD_TYPES = new Set([
  "password",
  "passwordAlphaNumeric",
  "complexPassword",
  "generatedPassword"
])
const URL_TYPES = new Set(["externalURL", "clientURL"])

function isPasswordLikeCustomField(
  key: string,
  label: string,
  fieldType: string
): boolean {
  return (
    PASSWORD_TYPES.has(fieldType) ||
    key.toLowerCase().includes("password") ||
    label.toLowerCase().includes("password")
  )
}

/* -------------------------------------------------------------------------- */
/*  One field                                                                  */
/* -------------------------------------------------------------------------- */

function CustomFieldRow({
  label,
  value,
  isSensitive,
  isRevealable,
  isUrl,
  isSwitch,
  menuItems,
  onReveal
}: {
  label: string
  value: string
  isSensitive: boolean
  isRevealable: boolean
  isUrl?: boolean
  isSwitch?: boolean
  menuItems?: Record<string, string>
  /** Fetches the real value of a sensitive field. Resolves undefined on failure. */
  onReveal?: () => Promise<string | undefined>
}) {
  const t = useTranslations("appboxmanager.appDetail")
  const [revealed, setRevealed] = useState(false)
  const [revealedValue, setRevealedValue] = useState<string>()
  const [isRevealing, setIsRevealing] = useState(false)
  const [copied, setCopied] = useState(false)

  const getSensitiveValue = async (): Promise<string | undefined> => {
    if (!isSensitive) return value
    if (!isRevealable) return undefined
    if (revealedValue !== undefined) return revealedValue
    setIsRevealing(true)
    try {
      const next = await onReveal?.()
      if (next !== undefined) setRevealedValue(next)
      return next
    } finally {
      setIsRevealing(false)
    }
  }

  const handleCopy = async () => {
    const copyValue = await getSensitiveValue()
    if (copyValue === undefined) return

    void navigator.clipboard.writeText(copyValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleReveal = async () => {
    if (revealed) {
      setRevealed(false)
      return
    }

    const nextValue = await getSensitiveValue()
    if (nextValue !== undefined) setRevealed(true)
  }

  let displayValue = value
  if (isSwitch) {
    displayValue =
      value === "1" || value === "true"
        ? t("customFieldEnabled")
        : t("customFieldDisabled")
  } else if (menuItems) {
    displayValue = menuItems[value] ?? value
  }

  return (
    <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[minmax(8rem,14rem)_minmax(0,1fr)]">
      <dt className="text-kumo-subtle">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        {isUrl && value ? (
          <KumoLink
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 break-all"
          >
            {displayValue}
          </KumoLink>
        ) : (
          <span className="min-w-0 flex-1 font-medium break-all">
            {isSensitive && !revealed
              ? "••••••••••"
              : isSensitive && revealedValue !== undefined
                ? revealedValue
                : displayValue}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1">
          {isUrl && value && (
            <Tooltip
              content={t("openLink")}
              render={
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("openLink")}: ${label}`}
                  className="flex size-6.5 cursor-pointer items-center justify-center rounded-md text-kumo-default ring ring-kumo-line hover:bg-kumo-tint"
                >
                  <ArrowSquareOutIcon size={14} />
                </a>
              }
            />
          )}
          {isSensitive && isRevealable && (
            <Tooltip
              content={revealed ? t("hide") : t("show")}
              render={
                <Button
                  size="sm"
                  shape="square"
                  icon={revealed ? EyeSlashIcon : EyeIcon}
                  aria-label={`${revealed ? t("hide") : t("show")}: ${label}`}
                  loading={isRevealing}
                  onClick={() => void handleToggleReveal()}
                />
              }
            />
          )}
          <Tooltip
            content={t("copy")}
            render={
              <Button
                size="sm"
                shape="square"
                icon={
                  copied ? (
                    <CheckIcon className="text-kumo-success" />
                  ) : (
                    <CopyIcon />
                  )
                }
                aria-label={`${t("copy")}: ${label}`}
                disabled={isSensitive && isRevealable && isRevealing}
                onClick={() => void handleCopy()}
              />
            }
          />
        </span>
      </dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface CustomFieldsProps {
  fields?: Record<string, CustomField>
  /** Fetches the real value of a sensitive field by its id. Resolves undefined on failure. */
  onReveal: (fieldId: number) => Promise<string | undefined>
}

/**
 * The values the app was installed with that the customer needs afterwards:
 * addresses, user names, passwords. Passwords stay masked until revealed, and
 * every value can be copied. Renders nothing when there is nothing to show.
 */
export function CustomFields({ fields, onReveal }: CustomFieldsProps) {
  const t = useTranslations("appboxmanager.appDetail")
  if (!fields) return null

  const fieldValues = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [
      key,
      field.defaultValue == null ? "" : String(field.defaultValue)
    ])
  )
  const entries = Object.entries(fields).filter(([, field]) => {
    const fieldType = field.type ?? "text"
    const displayValue = String(field.defaultValue ?? "").trim()
    return (
      field.params?.showOnInstalled !== false &&
      isFieldVisible(field, fieldValues) &&
      !HIDDEN_TYPES.has(fieldType) &&
      displayValue.length > 0
    )
  })
  if (entries.length === 0) return null

  return (
    <Panel title={t("customFields")}>
      <dl className="-my-2.5 grid grid-cols-1 divide-y divide-kumo-hairline">
        {entries.map(([key, value]) => {
          let label = key
          let displayValue = ""
          let fieldType = "text"
          let menuItems: Record<string, string> | undefined
          let fieldId: number | undefined
          let isSensitive = false
          let isRevealable = false

          if (value && typeof value === "object") {
            const field = value as CustomField
            label = field.label ?? key
            displayValue = String(field.defaultValue ?? "")
            fieldType = field.type ?? "text"
            fieldId = field.fieldId
            isSensitive = Boolean(field.sensitive)
            isRevealable = Boolean(field.revealable)
            if (
              field.params?.menuItems &&
              typeof field.params.menuItems === "object"
            ) {
              menuItems = field.params.menuItems as Record<string, string>
            }
          } else {
            displayValue = String(value ?? "")
          }

          const isPassword = isPasswordLikeCustomField(key, label, fieldType)
          isSensitive = isSensitive || isPassword
          isRevealable =
            isRevealable || (isPassword && typeof fieldId === "number")

          return (
            <CustomFieldRow
              key={key}
              label={label}
              value={displayValue}
              isSensitive={isSensitive}
              isRevealable={isRevealable && typeof fieldId === "number"}
              isUrl={URL_TYPES.has(fieldType)}
              isSwitch={fieldType === "switch"}
              menuItems={menuItems}
              onReveal={
                typeof fieldId === "number"
                  ? () => onReveal(fieldId)
                  : undefined
              }
            />
          )
        })}
      </dl>
    </Panel>
  )
}
