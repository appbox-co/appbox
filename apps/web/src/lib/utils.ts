import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  input: string | number,
  locale: Intl.LocalesArgument = "en-US"
): string {
  const date = new Date(input)
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
}

export function absoluteUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}${path}`
}

export function truncateText(text: string, maxLength: number = 105) {
  if (text?.length > maxLength) {
    return text.slice(0, maxLength) + "..."
  }

  return text
}

export const isDev = process.env.NODE_ENV === "development"
