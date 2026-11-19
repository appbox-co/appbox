/**
 * Sample data for the dev-only Kumo prototype pages. Nothing here is fetched:
 * the pages render without a session.
 */
import type {
  AppCategory,
  AppStoreItem,
  AppVersion
} from "@/api/apps/app-store"
import type { BlogPost } from "@/api/blog/blog"
import type { CyloDetail, CyloSummary } from "@/api/cylos/cylos"
import type { InstalledApp } from "@/api/installed-apps/installed-apps"
import type { Notification } from "@/api/notifications/notifications"
import type { StripApp } from "../_components/app-strip"

export const demoUser = { name: "Demo user", email: "demo@example.com" }

const GIB = 1024 ** 3
const MINUTE = 60_000
const LOADED_AT = Date.now()

function minutesAgo(minutes: number) {
  return new Date(LOADED_AT - minutes * MINUTE).toISOString()
}

export const cylos: CyloSummary[] = [
  {
    id: 1,
    name: "media-box",
    server_name: "ams-42",
    status: "online",
    storage_used: 1412,
    storage_total: 2000,
    app_slots_used: 9,
    app_slots_total: 12,
    upload_used: 842 * GIB,
    download_used: 1930 * GIB,
    resource_multiplier: 1,
    is_migrating: false,
    is_throttled: false,
    is_low_quota: false,
    package_name: "Appbox 2TB"
  },
  {
    id: 2,
    name: "automation",
    server_name: "ams-17",
    status: "online",
    storage_used: 463,
    storage_total: 500,
    app_slots_used: 4,
    app_slots_total: 6,
    upload_used: 61 * GIB,
    download_used: 208 * GIB,
    resource_multiplier: 1,
    is_migrating: false,
    is_throttled: true,
    is_low_quota: true,
    package_name: "Appbox 500GB"
  },
  {
    id: 3,
    name: "windows-vps",
    server_name: "ams-08",
    status: "restarting",
    storage_used: 38,
    storage_total: 250,
    app_slots_used: 1,
    app_slots_total: 4,
    upload_used: 3 * GIB,
    download_used: 12 * GIB,
    resource_multiplier: 1,
    is_migrating: false,
    is_throttled: false,
    is_low_quota: false,
    package_name: "VPS 250GB"
  }
]

interface CatalogueRow {
  name: string
  icon: string
  publisher: string
  categories: string[]
  slots: number
  votes: number
  version: string
  created: string
  /** Defaults to the created date. */
  updated?: string
  featured?: boolean
  docs?: string
  description: string
}

/**
 * Real catalogue names, icons, publishers, categories and versions, so the
 * sample pages look like production. Descriptions are written for the demo.
 */
const ROWS: CatalogueRow[] = [
  {
    name: "Plex",
    icon: "aebda823a279b219476c565be863d83739999502.png",
    publisher: "Plex, Inc",
    categories: ["Streaming", "Media"],
    slots: 1,
    votes: 197,
    version: "latest-8",
    created: "2016-06-02",
    updated: "2026-11-10",
    docs: "https://www.appbox.co/docs",
    description:
      "Organise your films, shows and music and stream them to any device."
  },
  {
    name: "Jellyfin",
    icon: "3e0a7f109bd760b9474c78cb652e8c3e82669226.png",
    publisher: "Jellyfin",
    categories: ["Streaming"],
    slots: 1,
    votes: 70,
    version: "latest-13",
    created: "2020-04-29",
    updated: "2026-11-06",
    description: "Free software media server for your films, shows and music."
  },
  {
    name: "qBittorrent",
    icon: "3ebd4dd8afe6308e392ccf09e3516eee99a1e8df.png",
    publisher: "qBittorrent",
    categories: ["File Transfer"],
    slots: 1,
    votes: 40,
    version: "5.2.4",
    created: "2021-06-08",
    updated: "2026-10-28",
    description: "Open-source BitTorrent client with a built-in search engine."
  },
  {
    name: "Nextcloud",
    icon: "f2baa52d02ca888455ce47823f47bf372d5eecb3.png",
    publisher: "Nextcloud",
    categories: ["Sync", "File Manager"],
    slots: 1,
    votes: 7,
    version: "35.0.0-5",
    created: "2023-07-24",
    docs: "https://www.appbox.co/docs",
    description: "Files, calendars and contacts on a cloud you control."
  },
  {
    name: "n8n",
    icon: "n8n.png",
    publisher: "n8n",
    categories: ["Programming"],
    slots: 1,
    votes: 1,
    version: "2.26.7-2",
    created: "2026-06-22",
    updated: "2026-11-02",
    featured: true,
    docs: "https://www.appbox.co/docs",
    description: "Workflow automation with hundreds of integrations."
  },
  {
    name: "Immich",
    icon: "101e12b916274de5d628fad717f09c5ca302b5c2.png",
    publisher: "FUTO",
    categories: ["Media", "Sync"],
    slots: 1,
    votes: 1,
    version: "3.1.0-1",
    created: "2026-03-18",
    description: "Photo and video backup with mobile apps."
  },
  {
    name: "Ubuntu Container",
    icon: "cc3f11fd619e0e85b542c041ecca8e009d0bf901.png",
    publisher: "Canonical",
    categories: ["OS Containers", "Operating System"],
    slots: 5,
    votes: 0,
    version: "24.04 MATE r2",
    created: "2026-04-30",
    description: "An Ubuntu desktop container with the MATE desktop."
  },
  {
    name: "Vaultwarden",
    icon: "ddf4f264320af1347ef54d424c60fae3b4fcc448.png",
    publisher: "dani-garcia",
    categories: ["Privacy"],
    slots: 1,
    votes: 0,
    version: "1.37.4",
    created: "2026-03-21",
    description: "Lightweight Bitwarden-compatible password manager server."
  },
  {
    name: "Debian Container",
    icon: "90f087a90d3b1a14d0c5959a5c3cecab313c7cd1.png",
    publisher: "Debian",
    categories: ["OS Containers", "Operating System"],
    slots: 1,
    votes: 0,
    version: "13 Minimal",
    created: "2026-10-02",
    description: "A minimal Debian container for your own software."
  },
  {
    name: "OpenClaw",
    icon: "c0e408a0ac1ea21e5206e43deb9e95d3381f7f5f.png",
    publisher: "OpenClaw",
    categories: ["Communication"],
    slots: 2,
    votes: 5,
    version: "2026.10.2-1",
    created: "2026-03-19",
    updated: "2026-10-20",
    featured: true,
    description: "Self-hosted AI assistant that works across your chat apps."
  },
  {
    name: "Navidrome",
    icon: "31e028553b33bf830e42d88a888ee1093e3dd591.png",
    publisher: "Navidrome",
    categories: ["Streaming", "Media"],
    slots: 1,
    votes: 5,
    version: "v0.61.2",
    created: "2025-04-30",
    description: "Music server and streamer compatible with Subsonic apps."
  },
  {
    name: "Windows 11 Pro VPS",
    icon: "0706f779e1383fbb8ea9dc4b8c5ee53f7171e27e.jpg",
    publisher: "Microsoft",
    categories: ["Windows", "VPS", "Operating System"],
    slots: 10,
    votes: 6,
    version: "11 Pro",
    created: "2025-05-28",
    description: "A Windows 11 Pro desktop running on your Appbox."
  },
  {
    name: "Debian VPS",
    icon: "0644d75fcfdec41e904fddc8c443bc5eebe274e9.png",
    publisher: "Debian",
    categories: ["VPS", "Operating System"],
    slots: 8,
    votes: 8,
    version: "Minimal 13",
    created: "2025-05-28",
    description: "A full Debian virtual machine with root access."
  },
  {
    name: "GitLab",
    icon: "f6196336d41f39eb35f4f69c53586e1b76b3063d.png",
    publisher: "GitLab Inc",
    categories: ["Projects", "File Manager"],
    slots: 5,
    votes: 9,
    version: "18.2.1",
    created: "2019-01-09",
    description: "Git hosting with issues, merge requests and CI/CD."
  },
  {
    name: "Ubuntu VPS",
    icon: "561c1eb3272d65e37c14e980a99783c4ff9c1d38.png",
    publisher: "Canonical",
    categories: ["VPS", "Operating System"],
    slots: 8,
    votes: 9,
    version: "Minimal 26.04",
    created: "2025-05-28",
    description: "A full Ubuntu virtual machine with root access."
  },
  {
    name: "Tautulli",
    icon: "93ce76191583a25ac33c1918c5ad0b8a5f260451.png",
    publisher: "Tautulli",
    categories: ["Streaming"],
    slots: 1,
    votes: 10,
    version: "2.18.2",
    created: "2020-04-08",
    description: "Monitoring and statistics for your Plex server."
  },
  {
    name: "Syncthing",
    icon: "7775c3bbf580fbaf57818e68ce7b1b48b8f93b95.png",
    publisher: "Syncthing",
    categories: ["Sync"],
    slots: 1,
    votes: 13,
    version: "v2.1.6",
    created: "2020-06-29",
    description: "Continuous file synchronisation between your devices."
  },
  {
    name: "Wireguard VPN",
    icon: "afef2217e82ee20638490bb102605f6e09789093.png",
    publisher: "Cylo",
    categories: ["Privacy"],
    slots: 1,
    votes: 44,
    version: "0.4.6-1",
    created: "2021-02-01",
    featured: true,
    description: "Fast, modern VPN tunnel to your Appbox."
  },
  {
    name: "Emby",
    icon: "3021fea57e9b932f14822d47e47d163f47812ef1.png",
    publisher: "Emby",
    categories: ["Streaming"],
    slots: 1,
    votes: 50,
    version: "latest-2",
    created: "2020-04-09",
    description: "Personal media server with apps for most devices."
  },
  {
    name: "Deluge",
    icon: "bc28bfa49a73fd2384cbecd6572ea72d0166aa28.png",
    publisher: "Deluge",
    categories: ["File Transfer"],
    slots: 1,
    votes: 103,
    version: "2.2.0",
    created: "2018-01-22",
    description:
      "Lightweight BitTorrent client with a web interface and plugins."
  },
  {
    name: "ruTorrent",
    icon: "fbf13ee99afeadddc4f73e1183fd1b52774b3474.png",
    publisher: "Novik",
    categories: ["File Transfer"],
    slots: 1,
    votes: 248,
    version: "5.3.15.5",
    created: "2018-01-19",
    description: "Web front end for the rTorrent BitTorrent client."
  }
]

const CATEGORY_NAMES = [
  ...new Set(ROWS.flatMap((row) => row.categories))
].sort()

export const categories: AppCategory[] = CATEGORY_NAMES.map((name, index) => ({
  id: index + 1,
  display_name: name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  app_count: ROWS.filter((row) => row.categories.includes(name)).length
}))

export const catalogue: AppStoreItem[] = ROWS.map((row, index) => ({
  id: index + 1,
  display_name: row.name,
  short_description: row.description,
  description: row.description,
  publisher: row.publisher,
  rating: row.votes,
  upvotes: row.votes,
  downvotes: 0,
  uservote: null,
  version: row.version,
  featured: row.featured ? 1 : 0,
  icon_image: row.icon,
  // Listing order stands in for install counts, independent of votes.
  installs: (ROWS.length - index) * 1200 + row.votes,
  app_slots: row.slots,
  enabled: 1,
  allow_multiple: 1,
  devsite: "",
  documentation_url: row.docs,
  helpsite: "",
  type: "docker",
  created_at: row.created,
  updated_at: row.updated ?? row.created,
  categories: row.categories.map((name) => ({
    key: CATEGORY_NAMES.indexOf(name) + 1,
    label: name
  })),
  default_version_id: null,
  enabled_version_count: 1,
  RequiresDomain: 0
}))

/** Catalogue apps the sample account already runs, and how many copies. */
export const installedCounts = new Map<number, number>(
  (
    [
      ["Plex", 2],
      ["Jellyfin", 2],
      ["qBittorrent", 1],
      ["Nextcloud", 1],
      ["n8n", 1]
    ] as const
  ).flatMap(([name, count]) => {
    const app = catalogue.find((entry) => entry.display_name === name)
    return app ? [[app.id, count] as const] : []
  })
)

function byDateDesc(field: "created_at" | "updated_at") {
  return [...catalogue].sort(
    (a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime()
  )
}

export const newestApps = byDateDesc("created_at").slice(0, 5)
export const recentlyUpdated = byDateDesc("updated_at").slice(0, 5)

/** `count` apps for an Appbox, cycling the catalogue, the first few pinned. */
function demoApps(cylo: CyloSummary, count: number, pinned: number) {
  return Array.from({ length: count }, (_, index): StripApp => {
    const { name, icon } = ROWS[index % ROWS.length]
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    return {
      id: cylo.id * 1000 + index,
      name,
      icon,
      domain: `${slug}.${cylo.name}.appbox.co`,
      pinned: index < pinned
    }
  })
}

// 40 apps overflows the row on a desktop screen, 6 fits, and one Appbox has
// a single app, which covers the three shapes the strip has to handle.
export const appsByCylo = new Map<number, StripApp[]>([
  [1, demoApps(cylos[0], 40, 4)],
  [2, demoApps(cylos[1], 6, 2)],
  [3, demoApps(cylos[2], 1, 0)]
])

function notification(
  id: number,
  fields: Pick<Notification, "type" | "action" | "content" | "is_read">,
  ageMinutes: number
): Notification {
  return {
    id,
    user_id: 1,
    relid: id,
    created_at: minutesAgo(ageMinutes),
    ...fields
  }
}

export const notifications: Notification[] = [
  notification(
    1,
    {
      type: "instance",
      action: "updated",
      content: "Plex on media-box was updated to 1.41.2",
      is_read: false
    },
    6
  ),
  notification(
    2,
    {
      type: "quota",
      action: "userlowquota",
      content: "automation is at 93% of its storage quota",
      is_read: false
    },
    95
  ),
  notification(
    3,
    {
      type: "cylo",
      action: "restarting",
      content: "windows-vps is restarting",
      is_read: true
    },
    60 * 5
  ),
  notification(
    4,
    {
      type: "instance",
      action: "add",
      content: "n8n was installed on automation",
      is_read: true
    },
    60 * 26
  )
]

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Launch week day 5: Windows VPS and freeze",
    excerpt:
      "Run a Windows desktop on your Appbox and freeze apps you are not using.",
    date: "2026-10-30",
    slug: "launch-week-day-5-windows-and-freeze"
  },
  {
    id: 2,
    title: "Introducing n8n on Appbox",
    excerpt: "Automate your workflows with a one-click n8n install.",
    date: "2026-10-12",
    slug: "introducing-n8n-on-appbox"
  },
  {
    id: 3,
    title: "Scheduled network maintenance",
    excerpt: "What is changing, when, and how it affects your services.",
    date: "2026-09-21",
    slug: "scheduled-network-maintenance-april-2026"
  }
]

/* -------------------------------------------------------------------------- */
/*  App detail                                                                 */
/* -------------------------------------------------------------------------- */

const SAMPLE_DESCRIPTION = `## What it does

Plex organises your films, shows, music and photos into one library and streams
them to any device, at home or away.

## Why run it on Appbox

- **Always on.** Your library is reachable without leaving a computer running.
- **Fast uplink.** Remote streams and transcodes use the server's connection, not yours.
- **Managed updates.** New versions arrive in the App Store; update when you are ready.

## Good to know

Sign in with your Plex account the first time you open the app, then point it at
your \`media\` folder. See the [Plex support site](https://support.plex.tv) for
client apps.`

/**
 * The catalogue's real screenshots for the sample apps, copied from the public
 * app details on 2026-11-13. Apps missing here have none in the catalogue.
 */
const SAMPLE_SCREENSHOTS: Record<
  string,
  { src: string; alt?: string; caption?: string }[]
> = {
  Plex: [
    {
      alt: "Plex Web showing a dark media library interface with poster artwork, navigation, and yellow Plex accents",
      src: "screenshots/plex-web-library-gemini-preview.png",
      caption: "Plex web library"
    }
  ],
  Jellyfin: [
    {
      alt: "Appbox installed app Overview for Jellyfin showing version, Appbox name, HTTPS URL, and Configuration credentials",
      src: "screenshots/jellyfin-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "Jellyfin web home after sign-in with empty libraries prompt and top navigation",
      src: "screenshots/jellyfin-web-home-logged-in.png",
      caption: "Signed-in web home"
    }
  ],
  qBittorrent: [
    {
      alt: "Installed qBittorrent on Appbox Overview tab showing Web UI URL, admin username, and masked password in Configuration",
      src: "screenshots/qbittorrent-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "qBittorrent Web UI after sign-in showing transfers toolbar, category filters, empty torrent table, and status bar",
      src: "screenshots/qbittorrent-web-main-logged-in.png",
      caption: "Web UI transfers"
    }
  ],
  Nextcloud: [
    {
      alt: "Appbox installed app Overview for Nextcloud showing version, online status, Actions, App Boost, and resource summary",
      src: "screenshots/nextcloud-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "Nextcloud Files app showing default folders and file list after sign-in",
      src: "screenshots/nextcloud-web-files-logged-in.png",
      caption: "Files after sign-in"
    },
    {
      alt: "Nextcloud Dashboard with greeting and recommended files widget in the web UI",
      src: "screenshots/nextcloud-web-dashboard-logged-in.png",
      caption: "Web dashboard"
    }
  ],
  n8n: [
    {
      alt: "n8n workflow editor showing connected automation nodes on a canvas with the node configuration panel open",
      src: "screenshots/n8n-workflow-editor.png",
      caption: "Workflow editor"
    }
  ],
  Immich: [
    {
      alt: "Appbox installed app Overview for Immich showing version, Appbox name, Login URL, and Configuration credentials",
      src: "screenshots/immich-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "Immich Photos library on the public demo with timeline thumbnails, albums sidebar, and search (same UI as a self-hosted instance)",
      src: "screenshots/immich-web-photos-demo-content.png",
      caption: "Photos library with content"
    },
    {
      alt: "Immich Photos timeline and navigation while signed into your Appbox instance",
      src: "screenshots/immich-web-photos-logged-in.png",
      caption: "Signed-in web library"
    }
  ],
  Vaultwarden: [
    {
      alt: "Appbox App Store page for Vaultwarden showing description, Get button, and feature bullets",
      src: "screenshots/vaultwarden-appstore-listing.png",
      caption: "App Store listing"
    },
    {
      alt: "Vaultwarden web vault after sign-in with sidebar, filters, and empty vault welcome state",
      src: "screenshots/vaultwarden-web-vault-logged-in.png",
      caption: "Web vault signed in"
    },
    {
      alt: "Vaultwarden Tools Generator view showing password options and generated password while signed in",
      src: "screenshots/vaultwarden-web-generator-logged-in.png",
      caption: "Password generator"
    }
  ],
  OpenClaw: [
    {
      alt: "Appbox App Store page for OpenClaw showing icon, Get button, description, and feature lists",
      src: "screenshots/openclaw-appstore-listing.png",
      caption: "Store listing"
    },
    {
      alt: "OpenClaw dashboard with chat sidebar and main workspace after sign-in (signed-in product UI)",
      src: "screenshots/openclaw-dashboard-chat.png",
      caption: "Dashboard and chat"
    },
    {
      alt: "Terminal connected to OpenClaw over SSH and running the openclaw onboard CLI wizard",
      src: "screenshots/openclaw-onboard-ssh-macos.png",
      caption: "SSH CLI onboarding"
    }
  ],
  Navidrome: [
    {
      alt: "Navidrome web UI after sign-in showing the Albums sidebar and Recently Added view",
      src: "screenshots/navidrome-web-library-logged-in.png",
      caption: "Signed-in library"
    },
    {
      alt: "Navidrome admin Users table listing accounts, admin flag, and last login",
      src: "screenshots/navidrome-web-users-admin.png",
      caption: "User management"
    }
  ],
  "Windows 11 Pro VPS": [
    {
      alt: "Appbox installed app Overview for Windows 11 Pro VPS showing RDP PC name, external host and port, masked credentials, spare ports, and console VNC port",
      src: "screenshots/windows-11-pro-vps-appbox-overview-rdp.png",
      caption: "RDP connection details"
    },
    {
      alt: "Windows 11 desktop in a Microsoft Remote Desktop session connected to the Appbox VPS, showing the taskbar and Start menu",
      src: "screenshots/windows-11-pro-vps-rdp-desktop.png",
      caption: "Remote Desktop session"
    },
    {
      alt: "VM Console tab with the Windows 11 guest desktop visible through noVNC",
      src: "screenshots/windows-11-pro-vps-web-console.png",
      caption: "Web console desktop"
    }
  ],
  "Debian VPS": [
    {
      alt: "Installed Debian VPS on Appbox: Overview tab with SSH hostname, port, masked passwords, and ssh command copy actions",
      src: "screenshots/debian-vps-installed-overview.png",
      caption: "SSH connection details"
    },
    {
      alt: "VM web console connected to a running Debian guest showing the login prompt after boot",
      src: "screenshots/debian-vps-web-console.png",
      caption: "VM web console"
    }
  ],
  GitLab: [
    {
      alt: "GitLab projects list after sign-in showing sidebar navigation, search, and contributed repositories",
      src: "screenshots/gitlab-projects-appbox.png",
      caption: "Projects workspace"
    },
    {
      alt: "GitLab admin area dashboard with instance overview cards for projects, users, groups, statistics, and component versions",
      src: "screenshots/gitlab-admin-dashboard.png",
      caption: "Admin dashboard"
    }
  ],
  "Ubuntu VPS": [
    {
      alt: "Installed Ubuntu VPS on Appbox: Overview tab with SSH hostname, port, masked passwords, and ssh command copy actions",
      src: "screenshots/ubuntu-vps-overview-ssh-configuration.png",
      caption: "SSH connection details"
    },
    {
      alt: "VM web console connected to a running Ubuntu guest showing the login prompt after boot",
      src: "screenshots/ubuntu-vps-web-console.png",
      caption: "VM web console"
    }
  ],
  Syncthing: [
    {
      alt: "Syncthing web dashboard with Folders list, This Device status, and Remote Devices section",
      src: "screenshots/syncthing-web-dashboard.png",
      caption: "Main dashboard"
    },
    {
      alt: "Syncthing Settings window on the GUI tab showing listen address, authentication fields, and theme options",
      src: "screenshots/syncthing-settings-gui.png",
      caption: "GUI settings"
    }
  ],
  Emby: [
    {
      alt: "Emby web app home after sign-in with sidebar, search, and Home tab on a dark theme",
      src: "screenshots/emby-web-home-logged-in.png",
      caption: "Web app after sign-in"
    },
    {
      alt: "Emby Server dashboard showing version, remote HTTPS URL on appboxes.co, status, alerts, and recent activity",
      src: "screenshots/emby-server-dashboard.png",
      caption: "Server dashboard"
    }
  ],
  Deluge: [
    {
      alt: "Appbox installed app overview for Deluge with Web UI link, daemon port, and username",
      src: "screenshots/deluge-2x-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "Deluge Web UI Preferences dialog showing Downloads, Network, and Queue categories",
      src: "screenshots/deluge-2x-web-preferences.png",
      caption: "Web UI preferences"
    }
  ],
  ruTorrent: [
    {
      alt: "Appbox installed app Overview for ruTorrent showing Web UI link, RPC URL, and masked credentials",
      src: "screenshots/rutorrent-appbox-overview.png",
      caption: "Installed app overview"
    },
    {
      alt: "ruTorrent main window after authentication with toolbar, category filters, and empty torrent list",
      src: "screenshots/rutorrent-main-list.png",
      caption: "Web UI after sign-in"
    }
  ]
}

function sampleMarketing(name: string) {
  const images = SAMPLE_SCREENSHOTS[name]
  return images ? [{ type: "screenshots", images }] : undefined
}

const SAMPLE_CUSTOM_FIELDS: NonNullable<AppStoreItem["customFields"]> = {
  claim_token: {
    label: "Plex claim token",
    type: "dynamicText",
    width: 12,
    validate: []
  },
  admin_password: {
    label: "Admin password",
    type: "password",
    width: 12,
    validate: ["required"],
    params: { generatePassword: true, generatedPasswordLength: 16 }
  },
  default_quality: {
    label: "Default quality",
    type: "selector",
    width: 12,
    defaultValue: "1080",
    params: { menuItems: { "720": "720p", "1080": "1080p", "2160": "4K" } }
  }
}

/** Catalogue entry with the extra fields only the detail endpoint returns. */
export function demoAppDetail(id: number): AppStoreItem | undefined {
  const app = catalogue.find((entry) => entry.id === id)
  if (!app) return undefined
  const isPlex = app.display_name === "Plex"
  return {
    ...app,
    // Install options: Plex has fields to fill in, Nextcloud needs a domain.
    customFields: isPlex ? SAMPLE_CUSTOM_FIELDS : undefined,
    custom_field_preinstall_description: isPlex
      ? "Optional: paste a claim token from plex.tv/claim to link this server to your Plex account."
      : null,
    RequiresDomain: app.display_name === "Nextcloud" ? 1 : 0,
    description: isPlex ? SAMPLE_DESCRIPTION : app.description,
    marketing_content: sampleMarketing(app.display_name),
    devsite: isPlex ? "https://www.plex.tv" : app.devsite,
    helpsite: isPlex ? "https://support.plex.tv" : app.helpsite,
    uservote: isPlex ? 1 : null
  }
}

export function demoVersions(app: AppStoreItem): AppVersion[] {
  const notes = [
    "Security fixes and a newer base image.",
    "Hardware transcoding improvements.",
    "Fixes a library scan that could stall on large folders.",
    "",
    "Initial release on the new platform.",
    "Legacy release, kept for rollbacks.",
    "Legacy release, kept for rollbacks."
  ]
  return notes.map(
    (changes, index) =>
      ({
        id: app.id * 100 + index,
        app_id: app.id,
        version:
          index === 0 ? app.version : `${app.version}-r${notes.length - index}`,
        app_slots: app.app_slots,
        memory: index < 2 ? 0 : 4,
        cpus: index < 2 ? 0 : 2,
        changes,
        enabled: 1,
        is_default: index === 0 ? 1 : 0,
        created_at: new Date(
          Date.UTC(2026, 10 - index, 10 - index)
        ).toISOString()
      }) as AppVersion
  )
}

const INSTANCE_STATUSES = ["online", "offline", "frozen", "restarting"]

/** The sample account's installs of one app, across its Appboxes. */
export function demoInstances(app: AppStoreItem): InstalledApp[] {
  const count = installedCounts.get(app.id) ?? 0
  const slug = app.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return Array.from({ length: count }, (_, index) => {
    const cylo = cylos[index % cylos.length]
    return {
      id: app.id * 1000 + index,
      app_id: app.id,
      display_name: app.display_name,
      icon_image: app.icon_image,
      version: app.version,
      status: INSTANCE_STATUSES[index % INSTANCE_STATUSES.length],
      port: 32400 + index,
      cylo_id: cylo.id,
      cylo_name: cylo.name,
      server_name: cylo.server_name,
      domain: `${slug}.${cylo.name}.appbox.co`,
      app_slots: app.app_slots,
      install_date: minutesAgo(60 * 24 * (40 + index * 90)),
      app_type: "docker",
      state: 1,
      enabled: true,
      cylo_default: 0,
      multiple_domains: 0,
      boost_slots: 0,
      use_boost_system: 0,
      boost_increment: 0,
      max_boost_multiplier: 0,
      max_boost_slots: 0,
      ram: 0,
      cpus: 0
    } as InstalledApp
  })
}

/** What each power action leaves an install in, for the sample pages. */
export const RESULTING_STATUS = {
  start: "online",
  stop: "offline",
  restart: "online",
  freeze: "frozen",
  unfreeze: "online"
} as const

function sampleStatus(index: number) {
  if (index === 2) return "restarting"
  if (index === 11) return "inactive"
  if (index % 13 === 7) return "frozen"
  if (index % 9 === 4) return "offline"
  return "online"
}

/**
 * Every sample install, as the installed-apps list returns them. Built from
 * the same apps the home page shows, so the two sample pages agree.
 */
export const demoInstalledApps: InstalledApp[] = cylos.flatMap((cylo) =>
  (appsByCylo.get(cylo.id) ?? []).map((strip, index) => {
    const app = catalogue.find((entry) => entry.display_name === strip.name)
    return {
      id: strip.id,
      app_id: app?.id ?? 0,
      display_name: strip.name,
      icon_image: strip.icon,
      version: app?.version ?? "",
      status: sampleStatus(index),
      port: 32400 + index,
      cylo_id: cylo.id,
      cylo_name: cylo.name,
      server_name: cylo.server_name,
      domain: strip.domain,
      app_slots: app?.app_slots ?? 1,
      install_date: minutesAgo(60 * 24 * (3 + index * 17)),
      app_type: "docker",
      state: 1,
      enabled: true,
      cylo_default: 0,
      multiple_domains: 0,
      boost_slots: 0,
      use_boost_system: 0,
      boost_increment: 0,
      max_boost_multiplier: 0,
      max_boost_slots: 0,
      ram: 0,
      cpus: 0
    } as InstalledApp
  })
)

/** Install id → pin order, from the pins the home page's icon strip shows. */
export const demoPinned = new Map<number, number>(
  [...appsByCylo.values()].flatMap((apps) =>
    apps.flatMap((app, index) => (app.pinned ? [[app.id, index] as const] : []))
  )
)

// Keep each Appbox's slot figures in step with its sample installs.
for (const cylo of cylos) {
  const used = demoInstalledApps
    .filter((app) => app.cylo_id === cylo.id)
    .reduce((sum, app) => sum + app.app_slots, 0)
  cylo.app_slots_used = used
  cylo.app_slots_total = Math.max(
    cylo.app_slots_total,
    Math.ceil((used + 3) / 10) * 10
  )
}

/** A sample install with the extra fields its own management page shows. */
export function demoInstalledAppDetail(id: number): InstalledApp | undefined {
  const app = demoInstalledApps.find((entry) => entry.id === id)
  if (!app) return undefined
  return {
    ...app,
    // The VPS apps are virtual machines: a console instead of charts.
    app_type: /VPS$/.test(app.display_name) ? "vm" : "docker",
    documentation_url: "https://www.appbox.co/docs",
    use_boost_system: 1,
    boost_slots: 1,
    boost_increment: 0.1,
    max_boost_multiplier: 2,
    max_boost_slots: 5,
    ram: 2,
    cpus: 1,
    multiple_domains: 1,
    can_update: true,
    allow_downgrade: false,
    default_version: app.version,
    available_versions: [
      { id: 3, version: app.version },
      { id: 2, version: `${app.version}-r1` }
    ],
    custom_description:
      app.display_name === "Plex"
        ? "Sign in with your Plex account the first time you open the app.\nYour media folder is mounted at /media."
        : undefined,
    custom_fields: {
      url: {
        fieldId: 1,
        label: "Web address",
        type: "externalURL",
        width: 12,
        defaultValue: `https://${app.domain}`
      },
      username: {
        fieldId: 2,
        label: "Username",
        type: "dynamicText",
        width: 6,
        defaultValue: "admin"
      },
      password: {
        fieldId: 3,
        label: "Password",
        type: "password",
        width: 6,
        defaultValue: "[hidden]",
        sensitive: true,
        revealable: true
      },
      transcoding: {
        fieldId: 4,
        label: "Hardware transcoding",
        type: "switch",
        width: 6,
        defaultValue: "1"
      },
      quality: {
        fieldId: 5,
        label: "Default quality",
        type: "selector",
        width: 6,
        defaultValue: "1080",
        params: { menuItems: { "720": "720p", "1080": "1080p", "2160": "4K" } }
      }
    }
  }
}

/** The fuller record the Appbox detail endpoint returns, from the summary. */
export function demoCyloDetail(id: number): CyloDetail | undefined {
  const cylo = cylos.find((entry) => entry.id === id)
  if (!cylo) return undefined
  return {
    id: cylo.id,
    name: cylo.name,
    server_name: cylo.server_name,
    server_host: "203.0.113.10",
    status: cylo.status,
    package_name: cylo.package_name,
    storage_used: cylo.storage_used,
    storage_total: cylo.storage_total,
    app_slots_used: cylo.app_slots_used,
    app_slots_total: cylo.app_slots_total,
    upload_used: cylo.upload_used,
    download_used: cylo.download_used,
    upload_total: 0,
    download_total: 0,
    resource_multiplier: cylo.resource_multiplier,
    is_migrating: cylo.is_migrating,
    is_throttled: cylo.is_throttled,
    is_low_quota: cylo.is_low_quota,
    whmcs_serviceid: 1000 + cylo.id,
    created_at: "2024-01-15T09:00:00Z"
  }
}
