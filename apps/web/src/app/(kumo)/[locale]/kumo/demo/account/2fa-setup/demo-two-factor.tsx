"use client"

import { useRef, useState } from "react"
import type { TwoFactorStatus } from "@/api/account/account"
import { ApiError } from "@/api/client"
import { ROUTES } from "@/constants/routes"
import {
  SAMPLE_PASSKEYS,
  samplePasskeyActions
} from "../../_lib/sample-passkeys"
import { sampleReauth } from "../../_lib/sample-reauth"
import { SampleStatePicker, useSampleState } from "../../_lib/sample-state"
import { PasskeysPanel } from "../../../_components/account/passkeys-panel"
import type { Reauth } from "../../../_components/account/recent-auth"
import { TwoFactorView } from "../../../_components/account/two-factor-view"
import { AppShell } from "../../../_components/app-shell"
import { buildSearchGroups } from "../../../_components/quick-search"
import { appsByCylo, cylos, demoUser } from "../../fixtures"

const STATES = [
  { value: "off", label: "Not set up" },
  { value: "off-reauth", label: "Not set up, sign-in needed" },
  { value: "on", label: "Enabled" },
  { value: "low", label: "Enabled, few codes left" },
  { value: "exhausted", label: "Enabled, no codes left" },
  { value: "required", label: "Enabled and required" },
  { value: "on-reauth", label: "Enabled, sign-in needed" }
] as const

type SampleState = (typeof STATES)[number]["value"]

const CODES_LEFT: Partial<Record<SampleState, number>> = {
  low: 2,
  exhausted: 0
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A made-up secret: the example key from the TOTP specification's test data. */
const SECRET = {
  secret: "JBSWY3DPEHPK3PXP",
  provisioning_uri:
    "otpauth://totp/Appbox:demo%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Appbox"
}

/** Ten made-up recovery codes; `seed` varies them between sets. */
function sampleCodes(seed: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 10 }, (_, row) =>
    Array.from(
      { length: 8 },
      (_, column) =>
        alphabet[(seed * 7 + row * 13 + column * 5 + row * column) % 32]
    ).join("")
  )
}

/** One sample state, remounted when the state changes so nothing carries over. */
function Sample({ state }: { state: SampleState }) {
  const [enabled, setEnabled] = useState(!state.startsWith("off"))
  // Bumped to start the page afresh, as arriving on it again would.
  const [visit, setVisit] = useState(0)
  // Whether the pretend session has signed in recently enough.
  const recent = useRef(!state.endsWith("reauth"))

  const guard = () => {
    if (!recent.current) {
      throw new ApiError(403, "Forbidden", "Recent authentication is required")
    }
  }
  /** As the API does: no code, no change; a code of all zeros is wrong. */
  const checkCode = (code: string) => {
    if (!code) {
      throw new ApiError(401, "Unauthorized", "Verification code is required")
    }
    if (/^0+$/.test(code)) {
      throw new ApiError(400, "Bad Request", "Invalid verification code")
    }
  }

  // Kept for the whole visit, so added and removed passkeys stay that way.
  const [samplePasskeys] = useState(() =>
    samplePasskeyActions(
      state.startsWith("off") ? [] : SAMPLE_PASSKEYS,
      !state.endsWith("reauth")
    )
  )

  const reauth: Reauth = async (request) => {
    const result = await sampleReauth(request)
    if (result.ok && !result.two_factor_required) {
      recent.current = true
      samplePasskeys.markSignedIn()
    }
    return result
  }

  const remaining = CODES_LEFT[state] ?? 8
  const status: TwoFactorStatus = {
    enabled,
    required: state === "required",
    verified_at: "2026-03-02T10:00:00Z",
    recovery_codes_remaining: remaining,
    recovery_codes_low: remaining > 0 && remaining <= 3,
    recovery_codes_exhausted: remaining === 0
  }

  return (
    <TwoFactorView
      key={visit}
      enabled={enabled}
      status={enabled ? status : undefined}
      onStartSetup={async () => {
        await wait(700)
        guard()
        return SECRET
      }}
      onVerify={async (code) => {
        await wait(800)
        guard()
        checkCode(code)
        return { recovery_codes: sampleCodes(1) }
      }}
      // The live page goes to the sign-in page here; the sample shows the
      // page as it would look after signing in again.
      onSetupDone={() => {
        setEnabled(true)
        setVisit((current) => current + 1)
      }}
      onRegenerate={async (code) => {
        await wait(700)
        guard()
        checkCode(code)
        return { recovery_codes: sampleCodes(2) }
      }}
      onDisable={async (code) => {
        await wait(700)
        guard()
        checkCode(code)
      }}
      // The live page signs out here.
      onDisabled={() => setEnabled(false)}
      reauth={reauth}
      passkeys={
        <PasskeysPanel actions={samplePasskeys.actions} reauth={reauth} />
      }
    />
  )
}

/**
 * The two-factor page on sample data. Nothing typed into it is sent anywhere:
 * any code is accepted except one of all zeros, and the QR code is a made-up
 * secret.
 */
export function DemoTwoFactor() {
  const state = useSampleState(STATES)

  return (
    <AppShell
      demo
      width="narrow"
      title="Two-factor authentication"
      currentDesignHref={ROUTES.TWO_FACTOR_SETUP}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        <SampleStatePicker states={STATES} value={state} />
        <Sample key={state} state={state} />
      </div>
    </AppShell>
  )
}
