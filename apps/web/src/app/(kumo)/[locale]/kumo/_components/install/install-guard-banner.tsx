"use client"

import { Banner } from "@cloudflare/kumo"
import {
  ArrowSquareOutIcon,
  WarningCircleIcon,
  WarningIcon
} from "@phosphor-icons/react"
import type { InstallGuard } from "./logic"

/** Why this app cannot be installed at all, with the way out when there is one. */
export function InstallGuardBanner({ guard }: { guard: InstallGuard }) {
  const isWarning = guard.type === "no_cylo"

  return (
    <Banner
      variant={isWarning ? "alert" : "error"}
      icon={
        isWarning ? (
          <WarningIcon weight="fill" />
        ) : (
          <WarningCircleIcon weight="fill" />
        )
      }
      // The action sits under the message: beside it, a dialog this narrow
      // would squeeze the message into a few words per line.
      description={
        <div className="grid justify-items-start gap-2.5">
          <p>{guard.message}</p>
          {guard.actionUrl &&
            guard.actionLabel &&
            (guard.actionUrl.startsWith("/") ? (
              <Banner.Action href={guard.actionUrl}>
                {guard.actionLabel}
              </Banner.Action>
            ) : (
              <Banner.Action href={guard.actionUrl} external>
                {guard.actionLabel}
                <ArrowSquareOutIcon aria-hidden="true" size={14} />
              </Banner.Action>
            ))}
        </div>
      }
    />
  )
}
