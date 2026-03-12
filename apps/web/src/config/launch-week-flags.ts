// Launch Week feature gates (toggle through Git).
export const launchWeekFlags = {
  day_1: true,
  day_2: true,
  day_3: true,
  day_4: true,
  day_5: false
} as const

type FlagKey = keyof typeof launchWeekFlags

export function isLaunchWeekEnabled(flag: FlagKey, isAdmin = false): boolean {
  return isAdmin || launchWeekFlags[flag]
}
