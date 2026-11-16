"use client"

import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import { usePathname, useRouter } from "@/i18n/routing"

export interface SampleStateOption<Value extends string> {
  value: Value
  label: string
}

/** The sample state named in `?state=`, or the first one. */
export function useSampleState<Value extends string>(
  states: readonly SampleStateOption<Value>[]
): Value {
  const requested = useSearchParams().get("state")
  return (
    states.find((entry) => entry.value === requested)?.value ?? states[0].value
  )
}

/**
 * Sample pages only: a way to see the states real data rarely shows. Choosing
 * one puts it in the address, so a state can be linked to and reloaded.
 */
export function SampleStatePicker<Value extends string>({
  states,
  value
}: {
  states: readonly SampleStateOption<Value>[]
  value: Value
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-kumo-line px-4 py-2.5">
      <span className="text-kumo-subtle">Sample state</span>
      <Select
        aria-label="Sample state"
        size="sm"
        className="w-60"
        value={value}
        onValueChange={(next) =>
          router.replace(
            next && next !== states[0].value
              ? `${pathname}?state=${String(next)}`
              : pathname
          )
        }
        renderValue={(current) =>
          states.find((entry) => entry.value === current)?.label
        }
      >
        {states.map((entry) => (
          <Select.Option key={entry.value} value={entry.value}>
            {entry.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}
