"use client"

import { useState } from "react"
import {
  Button,
  Input,
  InputArea,
  InputGroup,
  Select,
  Switch
} from "@cloudflare/kumo"
import {
  ArrowsClockwiseIcon,
  EyeIcon,
  EyeSlashIcon
} from "@phosphor-icons/react"
import { generateSecurePassword } from "@/lib/dynamic-form"
import type { FormFieldConfig } from "@/types/dashboard"
import { isSwitchChecked, toFieldValue } from "../install/logic"
import { FieldError, withRequiredMark } from "../ui/field-parts"

/**
 * One field of a custom button's form: the custom buttons' share of the
 * current design's FormFieldRenderer. It covers the types a button field can
 * map to (select, toggle, textarea, password, number, email and text).
 *
 * The install dialog's own field renderer is not reused because it treats
 * several field types differently (search, static text, URLs, dates, text
 * areas and switch captions), which a button's form does not.
 */
export function ActionFormField({
  config,
  value,
  error,
  onChange
}: {
  config: FormFieldConfig
  value: string
  error?: string
  onChange: (next: Parameters<typeof toFieldValue>[0]) => void
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
            controlFirst={false}
            checked={isSwitchChecked(value)}
            disabled={config.disabled}
            onCheckedChange={onChange}
          />
          {error && <FieldError>{error}</FieldError>}
        </div>
      )

    case "textarea":
      return (
        <InputArea
          id={fieldId}
          name={config.name}
          label={label}
          error={error}
          rows={3}
          placeholder={config.placeholder}
          disabled={config.disabled}
          value={value}
          onChange={onChange}
        />
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              disabled={config.disabled}
              onClick={() => {
                onChange(generateSecurePassword(config.generatedPasswordLength))
                setShowPassword(true)
              }}
            >
              {config.generatePasswordLabel ?? "Generate password"}
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
    case "email":
    default:
      return (
        <Input
          id={fieldId}
          name={config.name}
          type={config.type}
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
