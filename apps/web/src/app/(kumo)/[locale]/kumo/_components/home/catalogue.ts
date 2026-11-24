/*
 * What the home page takes from the public catalogue and the plans feed.
 * Plain functions, so the server page can call them.
 */
import type { App } from "@/api/appbox/hooks/use-apps"
import type { PlansData } from "@/components/ui/plans"

/** Catalogue icon file names by app name, for the illustrations. */
export type AppIcons = Record<string, string>

export interface WallApp {
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

/** The public catalogue sends categories as a list, or as that list's text. */
function categoriesOf(app: App): string[] {
  const raw = app.categories as unknown
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === "string") {
    return [...raw.matchAll(/'([^']+)'|"([^"]+)"/g)].map(
      (match) => match[1] ?? match[2]
    )
  }
  return []
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

/** Popular apps first, so the wall opens with names people know. */
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

export function wallApps(apps: App[]): WallApp[] {
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
    .map((app) => ({
      name: app.display_name,
      icon: app.icon_image,
      category: categoriesOf(app)[0] ?? ""
    }))
}

export function categoryCounts(apps: App[], limit = 9): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const app of apps) {
    for (const category of categoriesOf(app)) {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** "648TB" → 648, "10Gbps" → 10. */
const leadingNumber = (value: string) => Number.parseFloat(value) || 0
const spaced = (value: string) => value.replace(/(\d)([A-Za-z])/, "$1 $2")

export function planFacts(plans: PlansData): PlanFacts | null {
  const all = plans.data.flatMap((group) => group.plans)
  if (all.length === 0) return null
  const byStorage = [...all].sort(
    (a, b) =>
      leadingNumber(a.storage_capacity) - leadingNumber(b.storage_capacity)
  )
  const bySpeed = [...all].sort(
    (a, b) =>
      leadingNumber(a.connection_speed) - leadingNumber(b.connection_speed)
  )
  const slots = all.map((plan) => plan.app_slots)
  return {
    minStorage: spaced(byStorage[0].storage_capacity),
    maxStorage: spaced(byStorage[byStorage.length - 1].storage_capacity),
    minSlots: Math.min(...slots),
    maxSlots: Math.max(...slots),
    maxSpeed: spaced(bySpeed[bySpeed.length - 1].connection_speed)
  }
}

/** True when every plan in the feed has unmetered traffic. */
export function allUnmetered(plans: PlansData) {
  const all = plans.data.flatMap((group) => group.plans)
  return all.length > 0 && all.every((plan) => /unmetered/i.test(plan.traffic))
}
