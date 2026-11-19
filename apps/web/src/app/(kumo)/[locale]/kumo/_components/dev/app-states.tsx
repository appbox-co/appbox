"use client"

import { useState } from "react"
import { Collapsible } from "@cloudflare/kumo"
import { InstanceStatusBadge } from "../instance-controls"

/** The statuses an installed app can be forced into, and what each stands for. */
export const APP_STATUS_OPTIONS = [
  { value: "online", label: "Online", hint: "state=1, enabled" },
  { value: "offline", label: "Offline", hint: "state=0, enabled" },
  { value: "inactive", label: "Inactive", hint: "enabled=false" },
  { value: "installing", label: "Installing", hint: "installing=true" },
  { value: "updating", label: "Updating", hint: "updating=true" },
  { value: "deleting", label: "Deleting", hint: "deleting=true" }
] as const

/** What each status means in the API's terms, tucked away until asked for. */
export function AppStateReference() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.DefaultTrigger>State reference</Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>
        <ul className="grid list-none gap-1.5">
          {APP_STATUS_OPTIONS.map((status) => (
            <li key={status.value} className="flex items-center gap-2">
              <InstanceStatusBadge status={status.value} />
              <span className="font-mono text-xs text-kumo-subtle">
                {status.hint}
              </span>
            </li>
          ))}
        </ul>
      </Collapsible.DefaultPanel>
    </Collapsible.Root>
  )
}
