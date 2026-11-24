"use client"

import type { ReactNode } from "react"
import { Badge, Link as KumoLink, LinkButton } from "@cloudflare/kumo"
import {
  AppWindowIcon,
  ArrowRightIcon,
  GlobeIcon,
  HardDrivesIcon,
  LightningIcon,
  RocketIcon,
  TerminalWindowIcon,
  type Icon
} from "@phosphor-icons/react"
import type { PlansData } from "@/components/ui/plans"
import { Link } from "@/i18n/routing"
import { BoostScene } from "./boost-scene"
import type { AppIcons, CategoryCount, PlanFacts, WallApp } from "./catalogue"
import { HeroScene } from "./hero-scene"
import { InstallScene } from "./install-scene"
import { AppsWall, InstallCounter } from "./live-parts"
import { Plans } from "./plans"
import { SceneIcon } from "./scene"
import { ServersScene } from "./servers-scene"
import { AssistantScene, ConnectScene, HardwareScene } from "./small-scenes"

export interface HomeViewProps {
  icons: AppIcons
  appCount: number
  wall: WallApp[]
  categories: CategoryCount[]
  facts: PlanFacts | null
  plans: PlansData
  unmetered: boolean
  boostEnabled: boolean
  affiliateId?: string
}

/** Two-tone heading: the second line in the quieter text colour. */
function Heading({
  first,
  second,
  as: Tag = "h2"
}: {
  first: string
  second: string
  as?: "h1" | "h2"
}) {
  return (
    <Tag className={Tag === "h1" ? "ks-h1" : "ks-h2"}>
      {first}
      <span>{second}</span>
    </Tag>
  )
}

function FeatureIcon({ icon: IconComponent }: { icon: Icon }) {
  return (
    <IconComponent size={22} className="text-kumo-brand" aria-hidden="true" />
  )
}

function Fact({
  icon,
  title,
  children
}: {
  icon: Icon
  title: string
  children: ReactNode
}) {
  return (
    <div className="ks-fact">
      <FeatureIcon icon={icon} />
      <h3>{title}</h3>
      <p className="text-kumo-subtle">{children}</p>
    </div>
  )
}

function FeatureRow({
  id,
  icon,
  first,
  second,
  text,
  more,
  points,
  flip = false,
  scene
}: {
  id?: string
  icon: Icon
  first: string
  second: string
  text: string
  more: { label: string; href: string }
  points?: { title: string; text: string }[]
  flip?: boolean
  scene: ReactNode
}) {
  return (
    <section id={id} className={`ks-cell ks-row${flip ? " ks-flip" : ""}`}>
      <div className="ks-copy">
        <FeatureIcon icon={icon} />
        <Heading first={first} second={second} />
        <p className="ks-p text-kumo-subtle">{text}</p>
        {points && (
          <dl className="ks-points">
            {points.map((point) => (
              <div key={point.title}>
                <dt className="font-medium">{point.title}</dt>
                <dd className="mt-0.5 text-kumo-subtle">{point.text}</dd>
              </div>
            ))}
          </dl>
        )}
        <KumoLink href={more.href} className="mt-1">
          {more.label}
          <ArrowRightIcon size={14} aria-hidden="true" />
        </KumoLink>
      </div>
      <div className="ks-art">{scene}</div>
    </section>
  )
}

function Tile({
  title,
  text,
  scene
}: {
  title: string
  text: string
  scene: ReactNode
}) {
  return (
    <div className="ks-tile">
      <div className="ks-art">{scene}</div>
      <div className="ks-tile-text">
        <h3>{title}</h3>
        <p className="text-kumo-subtle">{text}</p>
      </div>
    </div>
  )
}

const FLOATERS = [
  { name: "Plex", x: 4, y: 50, r: -12, d: 0 },
  { name: "Nextcloud", x: 12, y: 200, r: 9, d: 1.2 },
  { name: "Jellyfin", x: 5, y: 330, r: -6, d: 2.1 },
  { name: "n8n", x: 86, y: 60, r: 8, d: 0.6 },
  { name: "Immich", x: 92, y: 210, r: -10, d: 1.7 },
  { name: "OpenClaw", x: 84, y: 320, r: 12, d: 2.6 }
]

export function HomeView({
  icons,
  appCount,
  wall,
  categories,
  facts,
  plans,
  unmetered,
  boostEnabled,
  affiliateId
}: HomeViewProps) {
  const apps = appCount ? `${appCount} apps` : "Apps"
  const ticker = [
    { icon: AppWindowIcon, text: `${appCount || "Dozens of"} one-click apps` },
    ...(boostEnabled
      ? [{ icon: LightningIcon, text: "App Boost on every plan" }]
      : []),
    ...(unmetered ? [{ icon: GlobeIcon, text: "Unmetered traffic" }] : []),
    { icon: HardDrivesIcon, text: "Hardware we own" },
    { icon: TerminalWindowIcon, text: "Linux and Windows VPS" },
    { icon: GlobeIcon, text: "Your own domain on any app" }
  ]

  return (
    <>
      <section className="ks-cell ks-hero">
        <div className="ks-hero-copy">
          <Link
            href="/blog"
            className="flex w-fit max-w-full items-center gap-2 rounded-full bg-kumo-base py-1 ps-1 pe-3 text-kumo-default shadow-xs ring ring-kumo-line hover:bg-kumo-tint"
          >
            <Badge variant="blue">New</Badge>
            <span className="truncate">Launch week: read all the posts</span>
            <ArrowRightIcon size={14} aria-hidden="true" />
          </Link>
          <Heading
            as="h1"
            first="Deploy apps in seconds"
            second="on your own Appbox"
          />
          <p className="ks-lead text-kumo-subtle">
            {appCount
              ? `Pick one of ${appCount} apps and an address, then click install.`
              : "Pick an app and an address, then click install."}{" "}
            Each app gets its own web address and shares your Appbox&apos;s
            storage.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/apps" variant="primary" icon={AppWindowIcon}>
              Browse apps
            </LinkButton>
            <LinkButton href="#plans" variant="secondary">
              See plans
            </LinkButton>
          </div>
          <InstallCounter />
        </div>
        <div className="ks-art ks-hero-art">
          <HeroScene icons={icons} />
        </div>
      </section>

      <section className="ks-cell ks-facts">
        <Fact icon={AppWindowIcon} title={`${apps}, one click`}>
          Every app installs from the same short form and gets its own web
          address.
        </Fact>
        <Fact icon={HardDrivesIcon} title="Your own Appbox">
          {facts
            ? `Plans run from ${facts.minStorage} to ${facts.maxStorage} of storage and from ${facts.minSlots} to ${facts.maxSlots} app slots.`
            : "Plans for a few apps up to hundreds, with storage to match."}
        </Fact>
        <Fact icon={GlobeIcon} title="Hardware we own">
          We run our own servers and network.
          {facts && ` Each Appbox connects at up to ${facts.maxSpeed}.`}
        </Fact>
      </section>

      <section className="ks-cell ks-intro">
        <Heading
          first="Why Appbox"
          second="Self-hosted apps without the server work."
        />
      </section>

      <FeatureRow
        icon={RocketIcon}
        first="Simple as a click."
        second="Zero configuration."
        text="Open-source apps are often complex to install. On Appbox you choose where the app runs, its address and a password, then click install. Appbox sets up the rest."
        more={{ label: "Browse the App Store", href: "/apps" }}
        scene={<InstallScene icons={icons} />}
      />
      <FeatureRow
        icon={LightningIcon}
        first="App Boost."
        second="More power for one app."
        text="Give one app more CPU and RAM from your spare app slots. You don't need to change plans, and Docker apps pick up the new resources without a restart."
        more={{
          label: "Read about App Boost",
          href: "/docs/platform/app-boost"
        }}
        flip
        scene={<BoostScene />}
      />
      <FeatureRow
        id="servers"
        icon={TerminalWindowIcon}
        first="Virtual private servers."
        second="Linux and Windows."
        text="Each VPS is a full KVM virtual machine with root access and a console in the dashboard, so you can't get locked out. Run Docker, snaps, flatpaks or any Windows software you need."
        points={[
          {
            title: "Six Linux distros",
            text: "Ubuntu, Debian, Arch Linux, Fedora, Rocky Linux and AlmaLinux."
          },
          {
            title: "Windows 11 Pro",
            text: "Connect over RDP with admin access. Your Appbox data is on the Z: drive."
          }
        ]}
        more={{ label: "Read the Launch Week posts", href: "/blog" }}
        scene={<ServersScene icons={icons} />}
      />

      <section className="ks-cell ks-bento">
        <Tile
          title="Connected apps"
          text="Apps share storage and talk over a private local bridge, so a download lands where your media server can see it."
          scene={<ConnectScene icons={icons} />}
        />
        <Tile
          title="Your AI assistant"
          text="OpenClaw runs on your Appbox and answers in the chat apps you already use, with your files and databases to hand."
          scene={<AssistantScene icons={icons} />}
        />
        <Tile
          title="Sovereign cloud"
          text="Custom Open Compute hardware and a network we run, so no one else's cloud sits under your apps."
          scene={<HardwareScene maxSpeed={facts?.maxSpeed} />}
        />
      </section>

      <section className="ks-cell ks-apps" id="apps">
        <Heading
          first={`${apps}, ready to deploy.`}
          second="Each one installs the same way."
        />
        <p className="ks-sub text-kumo-subtle">
          Media servers, databases, dev tools, chat and file sync, plus Linux
          and Windows virtual machines.
        </p>
        <AppsWall apps={wall} icons={icons} />
        {categories.length > 0 && (
          <div className="ks-cats">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/apps?category=${encodeURIComponent(category.name)}`}
              >
                <Badge variant="secondary">
                  {category.name}{" "}
                  <span className="text-kumo-subtle tabular-nums">
                    {category.count}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ks-cell ks-plans" id="plans">
        <div className="px-6 text-center">
          <Heading
            first="Plans for every size."
            second={
              unmetered
                ? "Unmetered traffic on all of them."
                : "Pick the storage and app slots you need."
            }
          />
          <p className="ks-sub text-kumo-subtle">
            {boostEnabled && "Every plan includes App Boost. "}Prices are per
            month in euros.
          </p>
        </div>
        <Plans
          plans={plans}
          affiliateId={affiliateId}
          boostEnabled={boostEnabled}
        />
      </section>

      <section className="ks-cell ks-closing">
        <div className="ks-band">
          <div className="ks-floaters" aria-hidden="true">
            {FLOATERS.map((floater) => (
              <span
                key={floater.name}
                className="ks-float"
                style={
                  {
                    "--x": `${floater.x}%`,
                    "--y": `${floater.y}px`,
                    "--r": `${floater.r}deg`,
                    "--d": `${floater.d}s`
                  } as React.CSSProperties
                }
              >
                <SceneIcon
                  icons={icons}
                  name={floater.name}
                  size={32}
                  className="rounded-[7px]"
                />
              </span>
            ))}
          </div>
          <h2 className="ks-band-h">Get your Appbox.</h2>
          <p className="ks-band-p">
            Pick a plan and install your first app.
            {unmetered && " Traffic is unmetered,"}
            {unmetered
              ? " and the servers are ours."
              : " The servers are ours."}
          </p>
          <div className="ks-band-ctas">
            <a className="ks-btn-white" href="#plans">
              See plans
            </a>
            <Link className="ks-btn-clear" href="/apps">
              Browse apps
            </Link>
          </div>
          <div className="ks-ticker" aria-hidden="true">
            <div className="ks-ticker-in">
              {[...ticker, ...ticker].map((item, index) => (
                <span key={index}>
                  <item.icon size={16} />
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
