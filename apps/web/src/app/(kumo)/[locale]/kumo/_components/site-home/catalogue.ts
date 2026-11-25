/*
 * What the home page takes from the public catalogue and the plans feed.
 * Plain functions, so the server page can call them.
 */
import type { App } from "@/api/appbox/hooks/use-apps"
import type { PlansData } from "@/components/ui/plans"

/** Catalogue icon file names by app name, for the illustrations. */
export type AppIcons = Record<string, string>

/** An app as the home page's app wall shows it. */
export interface CatalogueApp {
  name: string
  icon: string
  category: string
}

export interface CategoryCount {
  name: string
  count: number
}

export interface PlanFacts {
  minStorage: string
  maxStorage: string
  minSlots: number
  maxSlots: number
  maxSpeed: string
}

export function appIcons(apps: App[]): AppIcons {
  return Object.fromEntries(
    apps.map((app) => [app.display_name, app.icon_image])
  )
}

/** The address an app gets on the sample Appbox "ada". */
export function sampleDomain(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.ada.appboxes.co`
}

/**
 * Popular apps first, so the wall opens with names people know. The public
 * feed has no install counts to sort by.
 */
const WALL_FIRST = [
  "Plex",
  "Nextcloud",
  "Jellyfin",
  "Immich",
  "n8n",
  "OpenClaw",
  "AFFiNE",
  "Vaultwarden",
  "MySQL (MariaDB)",
  "Uptime Kuma",
  "Mattermost",
  "Docmost",
  "Plane",
  "Twenty",
  "Discourse",
  "Wordpress",
  "Syncthing",
  "Navidrome",
  "audiobookshelf",
  "GitLab",
  "Firefox",
  "Rclone",
  "Emby",
  "Calibre",
  "Transmission",
  "qBittorrent",
  "Deluge",
  "ruTorrent",
  "Ubuntu VPS",
  "Windows 11 Pro VPS",
  "Ubuntu Container",
  "Jitsi",
  "OnlyOffice",
  "Chatwoot",
  "Tautulli",
  "Wireguard VPN",
  "Resilio Sync",
  "Garage",
  "Cal.diy",
  "Rocket Chat",
  "Jupyter Notebook",
  "Arch Linux VPS"
]

/** An app as the wall and the site search list it. */
export function catalogueApp(app: App): CatalogueApp {
  return {
    name: app.display_name,
    icon: app.icon_image,
    category: app.categories[0] ?? ""
  }
}

/** The apps on the wall: as many as WALL_FIRST names, those first. */
export function wallApps(apps: App[]): CatalogueApp[] {
  const rank = (name: string) => {
    const index = WALL_FIRST.indexOf(name)
    return index === -1 ? WALL_FIRST.length : index
  }
  return [...apps]
    .sort(
      (a, b) =>
        rank(a.display_name) - rank(b.display_name) ||
        a.display_name.localeCompare(b.display_name)
    )
    .slice(0, WALL_FIRST.length)
    .map(catalogueApp)
}

export function categoryCounts(apps: App[], limit = 9): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const app of apps) {
    for (const category of app.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** "10Gbps" → "10 Gbps": the feed writes sizes and speeds without a space. */
export const spaced = (value: string) =>
  value.replace(/(\d)([A-Za-z])/, "$1 $2")

const SIZE_UNITS: Record<string, number> = { gb: 1, tb: 1000, pb: 1_000_000 }
const SPEED_UNITS: Record<string, number> = { mbps: 1, gbps: 1000 }

/** "648TB" in GB, "25Gbps" in Mbps; NaN when the unit isn't one of `units`. */
function amount(value: string, units: Record<string, number>) {
  const match = value.trim().match(/^([\d.]+)\s*([a-z]+)$/i)
  const scale = match ? units[match[2].toLowerCase()] : undefined
  return scale ? Number.parseFloat(match![1]) * scale : Number.NaN
}

function extremes<T>(items: T[], measure: (item: T) => number) {
  const known = items
    .map((item) => ({ item, value: measure(item) }))
    .filter(({ value }) => Number.isFinite(value))
    .sort((a, b) => a.value - b.value)
  return known.length ? [known[0].item, known[known.length - 1].item] : null
}

/** The ranges the facts strip quotes; null when the feed can't be read. */
export function planFacts(plans: PlansData): PlanFacts | null {
  const all = plans.data.flatMap((group) => group.plans)
  const storage = extremes(all, (plan) =>
    amount(plan.storage_capacity, SIZE_UNITS)
  )
  const speed = extremes(all, (plan) =>
    amount(plan.connection_speed, SPEED_UNITS)
  )
  if (!storage || !speed) return null
  const slots = all.map((plan) => plan.app_slots)
  return {
    minStorage: spaced(storage[0].storage_capacity),
    maxStorage: spaced(storage[1].storage_capacity),
    minSlots: Math.min(...slots),
    maxSlots: Math.max(...slots),
    maxSpeed: spaced(speed[1].connection_speed)
  }
}

/** True when every plan in the feed has unmetered traffic. */
export function allUnmetered(plans: PlansData) {
  const all = plans.data.flatMap((group) => group.plans)
  return all.length > 0 && all.every((plan) => /unmetered/i.test(plan.traffic))
}
