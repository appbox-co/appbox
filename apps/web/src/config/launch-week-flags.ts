// Launch Week feature gates (toggle through Git).
export const launchWeekFlags = {
  day_1: true,
  day_2: false,
  day_3: false,
  day_4: false,
  day_5: false
} as const

type FlagKey = keyof typeof launchWeekFlags

export function isLaunchWeekEnabled(flag: FlagKey, isAdmin = false): boolean {
  return isAdmin || launchWeekFlags[flag]
}
