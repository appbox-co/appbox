/*
 * Where the public site's header and footer lead. Pages that have no Kumo
 * version yet (the apps catalogue, docs, blog, policies) open in the current
 * design.
 */
import {
  AppWindowIcon,
  ArrowsLeftRightIcon,
  BookOpenIcon,
  CodeIcon,
  GlobeIcon,
  HardDrivesIcon,
  LightningIcon,
  LinuxLogoIcon,
  NewspaperIcon,
  PulseIcon,
  QuestionIcon,
  SnowflakeIcon,
  StackIcon,
  StorefrontIcon,
  WindowsLogoIcon,
  type Icon
} from "@phosphor-icons/react"
import { BILLING_BASE_URL } from "../shared"

export interface MenuLink {
  icon: Icon
  title: string
  text: string
  href: string
}

export interface MenuGroup {
  title: string
  links: MenuLink[]
}

export interface SiteMenu {
  key: string
  label: string
  groups: MenuGroup[]
}

export const ACCOUNT_LINKS = {
  billing: BILLING_BASE_URL,
  controlPanel: "/kumo/dashboard"
} as const

export function siteMenus(appCount: number): SiteMenu[] {
  return [
    {
      key: "products",
      label: "Products",
      groups: [
        {
          title: "Apps",
          links: [
            {
              icon: StorefrontIcon,
              title: "App Store",
              text: appCount
                ? `Install any of ${appCount} apps`
                : "Install apps in one click",
              href: "/apps"
            },
            {
              icon: LightningIcon,
              title: "App Boost",
              text: "More CPU and RAM for one app",
              href: "/docs/platform/app-boost"
            },
            {
              icon: SnowflakeIcon,
              title: "App Freeze",
              text: "Pause an app and free its slots",
              href: "/docs/platform/app-freeze"
            }
          ]
        },
        {
          title: "Servers",
          links: [
            {
              icon: LinuxLogoIcon,
              title: "Linux VPS",
              text: "Six distributions, root access",
              href: "/apps?category=VPS"
            },
            {
              icon: WindowsLogoIcon,
              title: "Windows VPS",
              text: "Windows 11 Pro in your browser",
              href: `/apps/${encodeURIComponent("Windows 11 Pro VPS")}`
            }
          ]
        },
        {
          title: "Developers",
          links: [
            {
              icon: GlobeIcon,
              title: "Custom domains",
              text: "Your own domain on any app",
              href: "/docs/platform/custom-domains"
            },
            {
              icon: CodeIcon,
              title: "Developer API",
              text: "Manage apps from scripts",
              href: "/docs/developer-api"
            }
          ]
        }
      ]
    },
    {
      key: "resources",
      label: "Resources",
      groups: [
        {
          title: "Learn",
          links: [
            {
              icon: BookOpenIcon,
              title: "Documentation",
              text: "Read the docs",
              href: "/docs"
            },
            {
              icon: NewspaperIcon,
              title: "Blog",
              text: "Latest articles and news",
              href: "/blog"
            },
            {
              icon: StackIcon,
              title: "Features",
              text: "Overview of features",
              href: "/#features"
            },
            {
              icon: ArrowsLeftRightIcon,
              title: "Alternatives",
              text: "Apps and what they replace",
              href: "/alternativesto"
            }
          ]
        },
        {
          title: "Help",
          links: [
            {
              icon: QuestionIcon,
              title: "FAQ",
              text: "Frequently asked questions",
              href: "/#faq"
            },
            {
              icon: PulseIcon,
              title: "Service status",
              text: "Check our service status",
              href: "https://status.appbox.co"
            }
          ]
        }
      ]
    }
  ]
}

/** Plain links beside the two menus. */
export const SITE_LINKS = [
  { title: "Apps", href: "/apps" },
  { title: "Pricing", href: "/kumo#plans" }
]

/** The phone menu's last group. */
export const MORE_LINKS: MenuLink[] = [
  {
    icon: AppWindowIcon,
    title: "Apps",
    text: "Browse the full catalogue",
    href: "/apps"
  },
  {
    icon: HardDrivesIcon,
    title: "Pricing",
    text: "Plans and what they include",
    href: "/kumo#plans"
  }
]
