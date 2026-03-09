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

export function truncateText(text: string, maxLength: number = 105) {
  if (text?.length > maxLength) {
    return text.slice(0, maxLength) + "..."
  }
  return text
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.min(
    Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))),
    sizes.length - 1
  )
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format a disk/storage value given in GB into a human-readable string.
 * Always displays in GB (with thousands separators) so the number matches
 * what customers purchased (e.g. "3,500 GB").
 * Values < 1 GB are shown in MB for clarity.
 */
export function formatStorageGB(gb: number): string {
  if (!gb || gb <= 0) return "0 GB"
  if (gb < 1) return `${Math.round(gb * 1024)} MB`
  return `${gb} GB`
}
