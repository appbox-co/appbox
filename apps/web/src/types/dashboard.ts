import type React from "react"
import type { ConditionalFieldMetadata } from "@/lib/dynamic-form"

export interface FormFieldConfig extends ConditionalFieldMetadata {
  name: string
  label: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "search"
    | "toggle"
    | "textarea"
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  description?: string
  disabled?: boolean
  generatePassword?: boolean
  generatedPasswordLength?: number
  generatePasswordLabel?: string
}

export interface StatCardProps {
  label: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  iconColor?: "blue" | "emerald" | "amber" | "cyan" | "purple" | "red"
  type?: "default" | "progress" | "bytes" | "multiplier" | "usage"
  progress?: number
  trend?: { value: number; direction: "up" | "down" }
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
}
