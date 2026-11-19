"use client"

import { useState } from "react"
import { InputGroup } from "@cloudflare/kumo"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  placeholder?: string
  error?: string
  autoFocus?: boolean
}

/** A password field with a button that shows what was typed, as Cloudflare's has. */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  autoFocus
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const toggleLabel = visible ? "Hide password" : "Show password"

  return (
    // `match: true` shows the message whatever the browser's own validity says.
    <InputGroup
      label={label}
      error={error ? { message: error, match: true } : undefined}
    >
      <InputGroup.Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        // The group's label already names it; Kumo still asks the input itself.
        aria-label={label}
        autoFocus={autoFocus}
        spellCheck={false}
      />
      <InputGroup.Addon align="end">
        <InputGroup.Button
          aria-label={toggleLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
        </InputGroup.Button>
      </InputGroup.Addon>
    </InputGroup>
  )
}
