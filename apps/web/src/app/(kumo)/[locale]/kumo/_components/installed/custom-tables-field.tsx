"use client"

import { useState } from "react"
import { Button, Input, InputGroup, Select, Switch } from "@cloudflare/kumo"
import {
  ArrowsClockwiseIcon,
  EyeIcon,
  EyeSlashIcon
} from "@phosphor-icons/react"
import { generateSecurePassword } from "@/lib/dynamic-form"
import type { FormFieldConfig } from "@/types/dashboard"
import { FieldError, withRequiredMark } from "../install/field-parts"
import { isSwitchChecked } from "../install/logic"

/** Text that stays in English, as it does in the current design's form fields. */
const COPY = {
  showPassword: "Show password",
  hidePassword: "Hide password",
  generatePassword: "Generate password"
} as const

/**
 * What a control hands back: a value, or the change event of a plain input.
 * The table decides what to store for each, as the current design does.
 */
export type FieldChange =
  string | number | boolean | { target?: { value?: unknown } } | undefined

/**
 * One field of a table's add or edit form. This is the custom tables' share of
 * the current design's FormFieldRenderer: a table column only ever maps to a
 * toggle, select, password, number or text field, so its other branches have
 * no counterpart here.
 *
 * The install dialog's CustomFieldInput is not reused because it treats more
 * field types specially (links, search, static text, dates) than a table form
 * does, and reports every change as text, which loses the difference between a
 * typed value and a toggled one that the table's change handler relies on.
 */
export function CustomTableField({
  config,
  value,
  error,
  onChange
}: {
  config: FormFieldConfig
  value: string
  error?: string
  onChange: (next: FieldChange) => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const fieldId = `form-field-${config.name}`
  const label = withRequiredMark(config.label, Boolean(config.required))

  switch (config.type) {
    case "select":
      return (
        <Select
          id={fieldId}
          label={label}
          error={error}
          className="w-full"
          placeholder={config.placeholder}
          disabled={config.disabled}
          items={config.options ?? []}
          // Uncontrolled, as in the current design: the value seeds the
          // control once and later outside changes do not move it.
          defaultValue={value || null}
          onValueChange={(next) => onChange(next ?? undefined)}
        />
      )

    case "toggle":
      return (
        <div className="grid gap-2">
          <Switch
            id={fieldId}
            label={label}
            // The label may carry the required mark, so name the control here.
            aria-label={config.label}
            controlFirst={false}
            checked={isSwitchChecked(value)}
            disabled={config.disabled}
            onCheckedChange={onChange}
          />
          {error && <FieldError>{error}</FieldError>}
        </div>
      )

    case "password":
      // An input with a show/hide button rather than Kumo's SensitiveInput,
      // which shows the value while it is typed and cannot be told to reveal
      // a password that was just generated.
      return (
        <div className="grid gap-2">
          <InputGroup
            label={label}
            error={error ? { message: error, match: true } : undefined}
            disabled={config.disabled}
          >
            <InputGroup.Input
              name={config.name}
              type={showPassword ? "text" : "password"}
              aria-label={config.label}
              placeholder={config.placeholder}
              value={value}
              onChange={onChange}
            />
            <InputGroup.Addon align="end" className="pr-1">
              <InputGroup.Button
                shape="square"
                icon={showPassword ? EyeSlashIcon : EyeIcon}
                aria-label={
                  showPassword ? COPY.hidePassword : COPY.showPassword
                }
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </InputGroup.Addon>
          </InputGroup>
          {config.generatePassword ? (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowsClockwiseIcon}
              className="justify-self-start"
              disabled={config.disabled}
              onClick={() => {
                onChange(generateSecurePassword(config.generatedPasswordLength))
                setShowPassword(true)
              }}
            >
              {config.generatePasswordLabel ?? COPY.generatePassword}
            </Button>
          ) : null}
        </div>
      )

    case "number":
      return (
        <Input
          id={fieldId}
          name={config.name}
          type="number"
          label={label}
          error={error}
          placeholder={config.placeholder}
          disabled={config.disabled}
          value={value}
          onChange={(event) => {
            const val = event.target.value
            onChange(val === "" ? "" : Number(val))
          }}
        />
      )

    case "text":
    default:
      return (
        <Input
          id={fieldId}
          name={config.name}
          type="text"
          label={label}
          error={error}
          placeholder={config.placeholder}
          disabled={config.disabled}
          value={value}
          onChange={onChange}
        />
      )
  }
}
