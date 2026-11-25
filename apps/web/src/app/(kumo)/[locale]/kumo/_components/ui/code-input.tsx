"use client"

import { cn } from "@cloudflare/kumo"
import {
  OTPInput,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  type SlotProps
} from "input-otp"

/** A six digit authenticator code, or an eight character recovery code. */
export type CodeKind = "totp" | "recovery"

export const CODE_LENGTH: Record<CodeKind, number> = { totp: 6, recovery: 8 }

function Slot({ char, hasFakeCaret, isActive }: SlotProps) {
  return (
    <span
      className={cn(
        "relative flex h-10 w-9 items-center justify-center rounded-md bg-kumo-base font-mono text-base ring ring-kumo-line",
        isActive && "ring-2 ring-kumo-brand"
      )}
    >
      {char}
      {hasFakeCaret && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-4 w-px animate-pulse bg-kumo-default motion-reduce:animate-none"
        />
      )}
    </span>
  )
}

interface CodeInputProps {
  kind?: CodeKind
  /** Names the field for assistive technology; there is no visible label inside it. */
  label: string
  value: string
  /** Called with the characters as typed; the caller decides when a code is complete. */
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
}

/**
 * One box per character, split into two groups, as the current design enters
 * codes. Authenticator codes take digits; recovery codes take letters as well.
 */
export function CodeInput({
  kind = "totp",
  label,
  value,
  onChange,
  id,
  disabled = false,
  required = false,
  autoFocus = false
}: CodeInputProps) {
  const length = CODE_LENGTH[kind]
  const half = length / 2

  return (
    <OTPInput
      id={id}
      aria-label={label}
      maxLength={length}
      minLength={required ? length : undefined}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      autoComplete="one-time-code"
      inputMode={kind === "totp" ? "numeric" : "text"}
      pattern={kind === "recovery" ? REGEXP_ONLY_DIGITS_AND_CHARS : undefined}
      containerClassName={cn(
        "flex items-center gap-2",
        disabled && "opacity-60"
      )}
      render={({ slots }) => (
        <>
          <span className="flex gap-1.5">
            {slots.slice(0, half).map((slot, index) => (
              <Slot key={index} {...slot} />
            ))}
          </span>
          <span aria-hidden="true" className="h-px w-2 bg-kumo-line" />
          <span className="flex gap-1.5">
            {slots.slice(half).map((slot, index) => (
              <Slot key={index} {...slot} />
            ))}
          </span>
        </>
      )}
    />
  )
}
