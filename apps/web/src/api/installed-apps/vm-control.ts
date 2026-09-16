/** Only the API can opt an installed Windows VM into this protection. */
export function hasWindowsPreshutdown(
  appType: string,
  raw: Record<string, unknown>
): boolean {
  return appType === "vm" && raw.windows_preshutdown_enabled === true
}

export function getVmControlPending(
  appType: string,
  raw: Record<string, unknown>
): boolean {
  if (!hasWindowsPreshutdown(appType, raw)) return false

  // The API owns the protected-restart lifetime. An accepted legacy restart is
  // terminal, so it must not be kept pending without this explicit projection.
  const pending = raw.vm_control_pending
  const protectedPending =
    pending === true ||
    pending === 1 ||
    (typeof pending === "string" &&
      ["1", "true"].includes(pending.trim().toLowerCase()))

  return (
    protectedPending ||
    ["queued", "executing", "unknown"].includes(
      String(raw.vm_control_status ?? "")
    ) ||
    (raw.vm_control_status === "accepted" && raw.vm_control_action === "stop")
  )
}
