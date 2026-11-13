// Launch Week feature gates (toggle through Git).
export const launchWeekFlags = {
  day_1: true,
  day_2: true,
  day_3: true,
  day_4: true,
  day_5: true
} as const

type FlagKey = keyof typeof launchWeekFlags

export function isLaunchWeekEnabled(flag: FlagKey, isAdmin = false): boolean {
  return isAdmin || launchWeekFlags[flag]
}

// The next Launch Week. Admins see these features before launch; docs pages
// with a matching `launch` frontmatter field stay out of the build until the
// day's flag is on (unless LAUNCH_PREVIEW=1).
export const nextLaunchWeekFlags = {
  day_1: false,
  day_2: false,
  day_3: false,
  day_4: false,
  day_5: false
} as const

export type NextLaunchWeekFlag = keyof typeof nextLaunchWeekFlags

export function isNextLaunchWeekEnabled(
  flag: NextLaunchWeekFlag,
  isAdmin = false
): boolean {
  return isAdmin || nextLaunchWeekFlags[flag]
}
