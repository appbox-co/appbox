"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FormFieldConfig } from "@/types/dashboard"
import { FormFieldRenderer } from "./form-field-renderer"

/* -------------------------------------------------------------------------- */
/*  Schema builder – creates a Zod schema from FormFieldConfig[]              */
/* -------------------------------------------------------------------------- */

function buildSchema(fields: FormFieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let schema: z.ZodTypeAny

    switch (field.type) {
      case "number":
        schema = field.required
          ? z.number({ error: `${field.label} is required` })
          : z.union([z.number(), z.literal("")]).optional()
        break

      case "toggle":
        schema = z.boolean().optional()
        break

      case "email":
        schema = field.required
          ? z
              .string({ error: `${field.label} is required` })
              .min(1, `${field.label} is required`)
              .email("Invalid email address")
          : z
              .string()
              .email("Invalid email address")
              .optional()
              .or(z.literal(""))
        break

      default:
        schema = field.required
          ? z
              .string({ error: `${field.label} is required` })
              .min(1, `${field.label} is required`)
          : z.string().optional()
        break
    }

    shape[field.name] = schema
  }

  return z.object(shape)
}

/* -------------------------------------------------------------------------- */
/*  DynamicForm                                                                */
/* -------------------------------------------------------------------------- */

interface DynamicFormProps {
  fields: FormFieldConfig[]
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void
  defaultValues?: Record<string, unknown>
  submitLabel?: string
  isLoading?: boolean
  className?: string
}

export function DynamicForm({
  fields,
  onSubmit,
  defaultValues = {},
  submitLabel = "Submit",
  isLoading = false,
  className
}: DynamicFormProps) {
  const schema = buildSchema(fields)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce<Record<string, unknown>>((acc, field) => {
      if (field.name in defaultValues) {
        acc[field.name] = defaultValues[field.name]
      } else {
        acc[field.name] = field.type === "toggle" ? false : ""
      }
      return acc
    }, {})
  })

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values)
      })}
      className={cn("space-y-4", className)}
    >
      {fields.map((field) => (
        <Controller
          key={field.name}
          name={field.name}
          control={control}
          render={({ field: controllerField }) => (
            <FormFieldRenderer
              config={field}
              field={controllerField}
              error={errors[field.name]?.message as string | undefined}
            />
          )}
        />
      ))}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
