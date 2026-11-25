"use client"

import { useMemo } from "react"
import { useAppDevFlags, type AppDevFlags } from "@/lib/app-dev-flags"
import type { Cylo } from "@/lib/auth/session"

/** The flags that force an install guard (all but `simulateUser`). */
const GUARD_FLAGS = [
  "appDisabled",
  "noCylos",
  "singleRestricted",
  "allRestricted",
  "mostRestricted",
  "someRestricted",
  "singleNoSlots",
  "noSlots",
  "mostNoSlots",
  "someNoSlots",
  "singleNoMulti",
  "noMulti",
  "mostNoMulti",
  "someNoMulti"
] as const satisfies readonly (keyof AppDevFlags)[]

const NO_CYLOS: Cylo[] = []

interface InstallDevInput {
  appId: number
  /** The Appboxes the dialog would offer. */
  cylos: Cylo[]
  isAdmin: boolean
  /** What the guard check found, for the Appboxes this returns. */
  restrictedCyloIds: Set<number>
  existingAppCyloIds: Set<number>
}

/**
 * What the install dialog works from once the install guards panel's flags
 * (development server only) have had their say: which Appboxes there are,
 * which are restricted, already have the app or are out of slots, and
 * whether the user counts as an admin. Without flags, and always in
 * production, everything comes back as given.
 */
export function useInstallDevOverrides({
  appId,
  cylos: realCylos,
  isAdmin,
  restrictedCyloIds,
  existingAppCyloIds
}: InstallDevInput) {
  const flags = useAppDevFlags(appId)

  // Any guard flag makes the user a non-admin, so its banner shows (admins
  // skip every guard).
  const guardActive = GUARD_FLAGS.some((flag) => flags?.[flag])
  const effectiveIsAdmin = guardActive || flags?.simulateUser ? false : isAdmin

  // Appboxes without a billing service id get a made-up one, so that upgrade
  // buttons show while testing.
  const withServiceIds = useMemo(() => {
    if (!guardActive) return realCylos
    return realCylos.map((cylo, index) =>
      cylo.whmcs_serviceid
        ? cylo
        : { ...cylo, whmcs_serviceid: String(99990 + index) }
    )
  }, [realCylos, guardActive])

  const firstOnly = useMemo(
    () => (withServiceIds.length > 0 ? [withServiceIds[0]] : []),
    [withServiceIds]
  )
  const singleAppbox =
    flags?.singleRestricted || flags?.singleNoSlots || flags?.singleNoMulti
  const cylos = flags?.noCylos
    ? NO_CYLOS
    : singleAppbox
      ? firstOnly
      : guardActive
        ? withServiceIds
        : realCylos

  const effectiveRestrictedCyloIds = useMemo(() => {
    if (flags?.singleRestricted || flags?.allRestricted) {
      return new Set(cylos.map((cylo) => cylo.id))
    }
    if (flags?.mostRestricted && cylos.length > 1) {
      // All but the last
      return new Set(cylos.slice(0, -1).map((cylo) => cylo.id))
    }
    if (flags?.someRestricted && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return restrictedCyloIds
  }, [
    flags?.singleRestricted,
    flags?.allRestricted,
    flags?.mostRestricted,
    flags?.someRestricted,
    cylos,
    restrictedCyloIds
  ])

  const effectiveExistingAppCyloIds = useMemo(() => {
    if (flags?.singleNoMulti || flags?.noMulti) {
      return new Set(cylos.map((cylo) => cylo.id))
    }
    if (flags?.mostNoMulti && cylos.length > 1) {
      return new Set(cylos.slice(0, -1).map((cylo) => cylo.id))
    }
    if (flags?.someNoMulti && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return existingAppCyloIds
  }, [
    flags?.singleNoMulti,
    flags?.noMulti,
    flags?.mostNoMulti,
    flags?.someNoMulti,
    cylos,
    existingAppCyloIds
  ])

  // Appboxes to treat as having no free slots.
  const noSlotsCyloIds = useMemo(() => {
    if (flags?.mostNoSlots && cylos.length > 1) {
      return new Set(cylos.slice(0, -1).map((cylo) => cylo.id))
    }
    if (flags?.someNoSlots && cylos.length > 0) {
      return new Set([cylos[0].id])
    }
    return new Set<number>()
  }, [flags?.mostNoSlots, flags?.someNoSlots, cylos])

  return {
    cylos,
    isAdmin: effectiveIsAdmin,
    restrictedCyloIds: effectiveRestrictedCyloIds,
    existingAppCyloIds: effectiveExistingAppCyloIds,
    noSlotsCyloIds
  }
}
