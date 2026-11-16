"use client"

import { useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  Banner,
  Link as KumoLink,
  Label,
  LinkButton,
  Select
} from "@cloudflare/kumo"
import {
  ArrowSquareOutIcon,
  InfoIcon,
  WarningCircleIcon
} from "@phosphor-icons/react"
import type { Cylo } from "@/lib/auth/session"
import { BILLING_BASE_URL } from "./logic"

/** One line under the selector explaining why some Appboxes are not listed. */
function Hint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-kumo-subtle">
      <span className="flex h-lh shrink-0 items-center">
        <InfoIcon aria-hidden="true" size={14} />
      </span>
      <span>{children}</span>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Appbox selector with hints for the Appboxes it filters out                 */
/* -------------------------------------------------------------------------- */

export function CyloSelector({
  cylos,
  availableCylos,
  migratingCyloIds,
  restrictedCyloIds,
  existingAppCyloIds,
  devNoSlotsCyloIds,
  allowMultiple,
  requiredSlots,
  selectedCylo,
  onSelectCylo,
  guardsLoading,
  label,
  noSlotsLabel,
  minimumRequiredPlan
}: {
  cylos: Cylo[]
  availableCylos: Cylo[]
  migratingCyloIds: Set<number>
  restrictedCyloIds: Set<number>
  existingAppCyloIds: Set<number>
  devNoSlotsCyloIds: Set<number>
  allowMultiple: number
  requiredSlots: number
  selectedCylo: string
  onSelectCylo: (value: string) => void
  guardsLoading: boolean
  label: string
  noSlotsLabel: string
  minimumRequiredPlan: string | null
}) {
  const t = useTranslations("appstore")
  const hiddenCount = cylos.length - availableCylos.length
  const restrictedCylos = cylos.filter((c) => restrictedCyloIds.has(c.id))
  const migratingCylos = cylos.filter((c) => migratingCyloIds.has(c.id))
  const noSlotsCylos = cylos.filter(
    (c) =>
      !migratingCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      (c.app_slots - c.app_slots_used < requiredSlots ||
        devNoSlotsCyloIds.has(c.id))
  )
  const alreadyInstalledCylos = cylos.filter(
    (c) =>
      allowMultiple === 0 &&
      existingAppCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      !migratingCyloIds.has(c.id) &&
      c.app_slots - c.app_slots_used >= requiredSlots &&
      !devNoSlotsCyloIds.has(c.id)
  )

  // For the "all ineligible" dropdown we track a separate selection
  const [ineligibleSelection, setIneligibleSelection] = useState("")

  function getIneligibleReason(c: Cylo) {
    if (migratingCyloIds.has(c.id)) return t("install.cyloSelector.migrating")
    if (restrictedCyloIds.has(c.id))
      return minimumRequiredPlan
        ? t("install.cyloSelector.restrictedOnPackageMinPlan", {
            plan: minimumRequiredPlan
          })
        : t("install.cyloSelector.restrictedOnPackage")
    if (
      c.app_slots - c.app_slots_used < requiredSlots ||
      devNoSlotsCyloIds.has(c.id)
    )
      return t("install.cyloSelector.noFreeSlots", {
        used: c.app_slots - c.app_slots_used,
        total: c.app_slots
      })
    if (allowMultiple === 0 && existingAppCyloIds.has(c.id))
      return t("install.cyloSelector.alreadyInstalled")
    return t("install.cyloSelector.notEligible")
  }

  function getUpgradeUrl(c: Cylo) {
    if (!c.whmcs_serviceid) return null
    // "Already installed" doesn't need an upgrade — needs a new Appbox
    const hasSlots =
      c.app_slots - c.app_slots_used >= requiredSlots &&
      !devNoSlotsCyloIds.has(c.id)
    if (
      allowMultiple === 0 &&
      existingAppCyloIds.has(c.id) &&
      !restrictedCyloIds.has(c.id) &&
      hasSlots
    )
      return null
    return `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
  }

  const selectedIneligibleCylo = cylos.find(
    (c) => String(c.id) === ineligibleSelection
  )
  const selectedUpgradeUrl = selectedIneligibleCylo
    ? getUpgradeUrl(selectedIneligibleCylo)
    : null
  const selectedReason = selectedIneligibleCylo
    ? getIneligibleReason(selectedIneligibleCylo)
    : null
  const isAlreadyInstalled =
    selectedIneligibleCylo &&
    allowMultiple === 0 &&
    existingAppCyloIds.has(selectedIneligibleCylo.id) &&
    !restrictedCyloIds.has(selectedIneligibleCylo.id) &&
    selectedIneligibleCylo.app_slots - selectedIneligibleCylo.app_slots_used >=
      requiredSlots

  const allIneligible = availableCylos.length === 0 && !guardsLoading
  const showIneligibleDropdown = allIneligible && cylos.length > 1

  const ineligibleOption = (c: Cylo) => (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      <span>{c.display_name}</span>
      <span className="text-kumo-subtle">— {getIneligibleReason(c)}</span>
    </span>
  )

  const availableOption = (c: Cylo) => (
    <span className="flex items-baseline gap-1.5">
      <span>{c.display_name}</span>
      <span className="text-kumo-subtle tabular-nums">
        (
        {t("install.cyloSelector.slotsFree", {
          count: c.app_slots - c.app_slots_used
        })}
        )
      </span>
    </span>
  )

  return (
    <div className="grid gap-2">
      {allIneligible ? (
        showIneligibleDropdown ? (
          /* Multiple appboxes but none eligible — dropdown to pick which to upgrade */
          <>
            <Select
              id="cylo-select"
              label={label}
              className="w-full"
              placeholder={t("install.cyloSelector.selectToSeeOptions")}
              // Kumo shows the placeholder for null; "" would count as a value.
              value={ineligibleSelection || null}
              onValueChange={(value) => {
                if (value !== null) setIneligibleSelection(value)
              }}
              renderValue={(value) => {
                const cylo = cylos.find((c) => String(c.id) === value)
                return cylo ? ineligibleOption(cylo) : null
              }}
              description={
                !selectedIneligibleCylo
                  ? t("install.cyloSelector.noneEligible")
                  : undefined
              }
            >
              {cylos.map((c) => (
                <Select.Option key={c.id} value={String(c.id)}>
                  {ineligibleOption(c)}
                </Select.Option>
              ))}
            </Select>

            {/* Show action for the selected ineligible appbox */}
            {selectedIneligibleCylo && (
              <div className="grid justify-items-start gap-2.5 rounded-lg bg-kumo-tint px-4 py-3">
                <p className="wrap-break-word text-kumo-subtle">
                  <span className="font-medium text-kumo-default">
                    {selectedIneligibleCylo.display_name}
                  </span>{" "}
                  — {selectedReason}
                </p>
                {selectedUpgradeUrl ? (
                  <LinkButton
                    href={selectedUpgradeUrl}
                    external
                    variant="primary"
                    size="sm"
                  >
                    {t("install.cyloSelector.upgradeThisAppbox")}
                    <ArrowSquareOutIcon aria-hidden="true" size={12} />
                  </LinkButton>
                ) : isAlreadyInstalled ? (
                  <>
                    <p className="text-sm leading-snug text-kumo-subtle">
                      {t("install.cyloSelector.alreadyInstalledDetail")}
                    </p>
                    <LinkButton href="/" variant="primary" size="sm">
                      {t("install.guard.getAnotherAppbox")}
                    </LinkButton>
                  </>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <>
            <Label>{label}</Label>
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              title={noSlotsLabel}
            />
          </>
        )
      ) : (
        <Select
          id="cylo-select"
          label={label}
          className="w-full"
          placeholder={label}
          // Kumo shows the placeholder for null; "" would count as a value.
          value={selectedCylo || null}
          onValueChange={(value) => {
            if (value !== null) onSelectCylo(value)
          }}
          renderValue={(value) => {
            const cylo = availableCylos.find((c) => String(c.id) === value)
            return cylo ? availableOption(cylo) : null
          }}
        >
          {availableCylos.map((cylo) => (
            <Select.Option key={cylo.id} value={String(cylo.id)}>
              {availableOption(cylo)}
            </Select.Option>
          ))}
        </Select>
      )}

      {/* Hints for filtered-out Appboxes */}
      {hiddenCount > 0 && availableCylos.length > 0 && (
        <ul className="grid list-none gap-1.5">
          {migratingCylos.length > 0 && (
            <Hint>
              {migratingCylos.length === 1
                ? t("install.cyloSelector.migratingSingle", {
                    name: migratingCylos[0].display_name
                  })
                : t("install.cyloSelector.migratingMultiple", {
                    count: migratingCylos.length
                  })}
            </Hint>
          )}
          {restrictedCylos.length > 0 && (
            <Hint>
              {restrictedCylos.length === 1
                ? t("install.cyloSelector.restrictedSingle", {
                    name: restrictedCylos[0].display_name
                  })
                : t("install.cyloSelector.restrictedMultiple", {
                    count: restrictedCylos.length
                  })}{" "}
              {restrictedCylos.map((c, i) => {
                const url = c.whmcs_serviceid
                  ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
                  : null
                if (!url) return null
                return (
                  <KumoLink
                    key={c.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("install.cyloSelector.upgradeName", {
                      name: c.display_name
                    })}
                    {i < restrictedCylos.length - 1 ? ", " : ""}
                  </KumoLink>
                )
              })}
            </Hint>
          )}
          {noSlotsCylos.length > 0 && (
            <Hint>
              {noSlotsCylos.length === 1
                ? t("install.cyloSelector.noSlotsSingle", {
                    name: noSlotsCylos[0].display_name
                  })
                : t("install.cyloSelector.noSlotsMultiple", {
                    count: noSlotsCylos.length
                  })}{" "}
              {noSlotsCylos.map((c, i) => {
                const url = c.whmcs_serviceid
                  ? `${BILLING_BASE_URL}/upgrade.php?type=package&id=${c.whmcs_serviceid}`
                  : null
                if (!url) return null
                return (
                  <KumoLink
                    key={c.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("install.cyloSelector.upgradeName", {
                      name: c.display_name
                    })}
                    {i < noSlotsCylos.length - 1 ? ", " : ""}
                  </KumoLink>
                )
              })}
            </Hint>
          )}
          {alreadyInstalledCylos.length > 0 && (
            <Hint>
              {alreadyInstalledCylos.length === 1
                ? t("install.cyloSelector.installedSingle", {
                    name: alreadyInstalledCylos[0].display_name
                  })
                : t("install.cyloSelector.installedMultiple", {
                    count: alreadyInstalledCylos.length
                  })}{" "}
              {t("install.cyloSelector.onePerAppbox")}
            </Hint>
          )}
        </ul>
      )}
    </div>
  )
}
