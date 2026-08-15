"use client"

import { useState } from "react"
import { Eye, EyeOff, RefreshCw } from "lucide-react"
import type { ControllerRenderProps, FieldValues } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { generateSecurePassword } from "@/lib/dynamic-form"
import { cn } from "@/lib/utils"
import type { FormFieldConfig } from "@/types/dashboard"

/* -------------------------------------------------------------------------- */
/*  Inline Textarea (no ui/textarea dependency)                                */
/* -------------------------------------------------------------------------- */

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Inline Toggle / Switch (no ui/switch dependency)                           */
/* -------------------------------------------------------------------------- */

interface ToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  appboxStyle?: boolean
}

function Toggle({
  checked,
  onCheckedChange,
  disabled,
  id,
  appboxStyle = false
}: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-ring peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        appboxStyle
          ? "appbox-cut-surface [--marketing-cut-size:5px]"
          : "rounded-full border-2 border-transparent",
        checked
          ? appboxStyle
            ? "!bg-[var(--appbox-signal)]"
            : "bg-primary"
          : appboxStyle
            ? "appbox-subcard"
            : "bg-input"
      )}
    >
      <span
        className={cn(
          "bg-background pointer-events-none block size-4 rounded-full shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  FormFieldRenderer                                                          */
/* -------------------------------------------------------------------------- */

interface FormFieldRendererProps {
  config: FormFieldConfig
  field: ControllerRenderProps<FieldValues, string>
  error?: string
  inputClassName?: string
  useAppboxFieldFrame?: boolean
}

export function FormFieldRenderer({
  config,
  field,
  error,
  inputClassName,
  useAppboxFieldFrame = false
}: FormFieldRendererProps) {
  const [showPassword, setShowPassword] = useState(false)
  const fieldId = `form-field-${config.name}`
  const controlClassName = cn(
    useAppboxFieldFrame && "appbox-form-control",
    inputClassName
  )

  const withFieldFrame = (control: React.ReactNode) =>
    useAppboxFieldFrame ? (
      <div
        className={cn(
          "appbox-field-frame",
          error && "appbox-field-frame-error"
        )}
      >
        {control}
      </div>
    ) : (
      control
    )

  const renderField = () => {
    switch (config.type) {
      case "select":
        return (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value as string}
            disabled={config.disabled}
          >
            <SelectTrigger id={fieldId} className={inputClassName}>
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "toggle":
        return (
          <div className="flex items-center gap-3">
            <Toggle
              id={fieldId}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={config.disabled}
              appboxStyle={useAppboxFieldFrame}
            />
          </div>
        )

      case "textarea":
        return withFieldFrame(
          <Textarea
            id={fieldId}
            placeholder={config.placeholder}
            disabled={config.disabled}
            className={controlClassName}
            {...field}
            value={(field.value as string) ?? ""}
          />
        )

      case "password":
        return (
          <div className="space-y-2">
            <div
              className={cn(
                "relative",
                useAppboxFieldFrame && "appbox-field-frame",
                useAppboxFieldFrame && error && "appbox-field-frame-error"
              )}
            >
              <Input
                id={fieldId}
                type={showPassword ? "text" : "password"}
                placeholder={config.placeholder}
                disabled={config.disabled}
                className={cn(controlClassName, "pr-11")}
                {...field}
                value={(field.value as string) ?? ""}
              />
              <Button
                type="button"
                variant={useAppboxFieldFrame ? "appboxQuiet" : "ghost"}
                size="icon"
                className="absolute right-0 top-0 h-full !min-h-0 px-3 hover:bg-transparent"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="text-muted-foreground size-4" />
                ) : (
                  <Eye className="text-muted-foreground size-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            {config.generatePassword ? (
              <Button
                type="button"
                variant={useAppboxFieldFrame ? "appboxOutline" : "outline"}
                size="sm"
                disabled={config.disabled}
                onClick={() => {
                  field.onChange(
                    generateSecurePassword(config.generatedPasswordLength)
                  )
                  setShowPassword(true)
                }}
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                {config.generatePasswordLabel ?? "Generate password"}
              </Button>
            ) : null}
          </div>
        )

      case "number":
        return withFieldFrame(
          <Input
            id={fieldId}
            type="number"
            placeholder={config.placeholder}
            disabled={config.disabled}
            className={controlClassName}
            {...field}
            value={(field.value as string | number) ?? ""}
            onChange={(e) => {
              const val = e.target.value
              field.onChange(val === "" ? "" : Number(val))
            }}
          />
        )

      case "search":
        return withFieldFrame(
          <Input
            id={fieldId}
            type="search"
            placeholder={config.placeholder}
            disabled={config.disabled}
            className={controlClassName}
            {...field}
            value={(field.value as string) ?? ""}
          />
        )

      case "text":
      case "email":
      default:
        return withFieldFrame(
          <Input
            id={fieldId}
            type={config.type}
            placeholder={config.placeholder}
            disabled={config.disabled}
            className={controlClassName}
            {...field}
            value={(field.value as string) ?? ""}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      {config.type !== "toggle" ? (
        <Label htmlFor={fieldId}>
          {config.label}
          {config.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      ) : (
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldId}>
            {config.label}
            {config.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
        </div>
      )}

      {renderField()}

      {config.description && !error && (
        <p className="text-muted-foreground text-xs">{config.description}</p>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
