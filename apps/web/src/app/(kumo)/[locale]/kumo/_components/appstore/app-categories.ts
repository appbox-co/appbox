import {
  ArrowsClockwiseIcon,
  ArrowsDownUpIcon,
  ChartLineIcon,
  ChatCircleIcon,
  CodeIcon,
  CubeIcon,
  DatabaseIcon,
  FilmSlateIcon,
  FolderIcon,
  GameControllerIcon,
  GlobeIcon,
  HardDrivesIcon,
  KanbanIcon,
  LightningIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  TerminalWindowIcon,
  WindowsLogoIcon,
  type Icon
} from "@phosphor-icons/react"

/** Internal category the current App Store also hides from filters and cards. */
export const HIDDEN_CATEGORY_ID = 16

/**
 * Categories come from the API as free text, so icons are matched on keywords.
 * Order matters: the first match wins ("OS Containers" before "Operating System").
 */
const CATEGORY_ICONS: [pattern: RegExp, icon: Icon][] = [
  [/stream/, PlayCircleIcon],
  [/media|photo|video|music/, FilmSlateIcon],
  [/transfer|download|torrent/, ArrowsDownUpIcon],
  [/sync|backup/, ArrowsClockwiseIcon],
  [/file|storage/, FolderIcon],
  [/privacy|security|vpn/, ShieldCheckIcon],
  [/container/, CubeIcon],
  [/windows/, WindowsLogoIcon],
  [/vps|virtual/, HardDrivesIcon],
  [/operating|linux/, TerminalWindowIcon],
  [/program|develop|code/, CodeIcon],
  [/commun|chat|social/, ChatCircleIcon],
  [/project|product/, KanbanIcon],
  [/game/, GameControllerIcon],
  [/automat/, LightningIcon],
  [/database/, DatabaseIcon],
  [/monitor|analytic/, ChartLineIcon],
  [/web|cms|site/, GlobeIcon]
]

export function categoryIcon(name: string): Icon {
  const key = name.toLowerCase()
  return (
    CATEGORY_ICONS.find(([pattern]) => pattern.test(key))?.[1] ??
    SquaresFourIcon
  )
}
