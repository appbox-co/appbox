"use client"

import { useRef, useState, type CSSProperties } from "react"
import { cn } from "@cloudflare/kumo"
import { AppIcon } from "../app-icon"
import type { AppIcons } from "./catalogue"
import { Stage, usePauseOffscreen, useSceneScript } from "./scene"

/* -------------------------------------------------------------------------- */
/*  Connected apps: a diagram of apps sharing storage and a local bridge      */
/* -------------------------------------------------------------------------- */

const WIRES = [
  { id: "ks-w-q", d: "M80 308 C 150 308, 170 240, 206 222" },
  { id: "ks-w-p", d: "M206 174 C 170 158, 150 88, 80 88" },
  { id: "ks-w-i", d: "M380 88 C 310 88, 290 158, 254 174" },
  { id: "ks-w-o", d: "M254 222 C 290 240, 310 308, 380 308" }
]
const PACKETS = [
  { wire: "ks-w-q", dur: "2.6s", begin: "0s" },
  { wire: "ks-w-q", dur: "2.6s", begin: "1.3s" },
  { wire: "ks-w-p", dur: "2.2s", begin: "0.6s" },
  { wire: "ks-w-i", dur: "3s", begin: "0.2s" },
  { wire: "ks-w-o", dur: "3.4s", begin: "1s" }
]
const NODES = [
  { name: "Plex", x: 80, y: 88 },
  { name: "qBittorrent", x: 80, y: 308 },
  { name: "Immich", x: 380, y: 88 },
  { name: "OpenClaw", x: 380, y: 308 },
  { name: "n8n", x: 150, y: 52 },
  { name: "MySQL (MariaDB)", label: "MariaDB", x: 310, y: 52 }
]
const TAGS = [
  { text: "downloads", x: 96, y: 254 },
  { text: "media", x: 118, y: 126 },
  { text: "photos", x: 300, y: 126 },
  { text: "shared files", x: 290, y: 254 }
]

export function ConnectScene({ icons }: { icons: AppIcons }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  usePauseOffscreen(sceneRef)

  return (
    <Stage width={460} height={380} sceneRef={sceneRef}>
      <svg viewBox="0 0 460 380" className="ks-graph">
        {WIRES.map((wire) => (
          <path key={wire.id} id={wire.id} className="ks-wire" d={wire.d} />
        ))}
        <path id="ks-w-b" className="ks-wire ks-bridge" d="M182 52 L 278 52" />
        {PACKETS.map((packet, index) => (
          <circle key={index} className="ks-pkt" r="3.5">
            <animateMotion
              dur={packet.dur}
              begin={packet.begin}
              repeatCount="indefinite"
            >
              <mpath href={`#${packet.wire}`} />
            </animateMotion>
          </circle>
        ))}
        <circle className="ks-pkt" r="3">
          <animateMotion
            dur="1.6s"
            repeatCount="indefinite"
            keyPoints="0;1;0"
            keyTimes="0;0.5;1"
            calcMode="linear"
          >
            <mpath href="#ks-w-b" />
          </animateMotion>
        </circle>
      </svg>
      {NODES.map((node) => (
        <div
          key={node.name}
          className="ks-node"
          style={{ left: node.x, top: node.y }}
        >
          <span className="ks-ic">
            <AppIcon
              icon={icons[node.name] ?? ""}
              name={node.name}
              className="size-8 rounded-[7px]"
            />
          </span>
          {node.label ?? node.name}
        </div>
      ))}
      <div className="ks-hub" style={{ left: 230, top: 198 }}>
        <span className="ks-ic">
          <span className="ks-logo-box" />
        </span>
        Your Appbox
      </div>
      {TAGS.map((tag) => (
        <span
          key={tag.text}
          className="ks-wtag"
          style={{ left: tag.x, top: tag.y }}
        >
          {tag.text}
        </span>
      ))}
      <span className="ks-wtag ks-brand" style={{ left: 230, top: 30 }}>
        local network
      </span>
    </Stage>
  )
}

/* -------------------------------------------------------------------------- */
/*  Assistant: OpenClaw answering in a chat app                               */
/* -------------------------------------------------------------------------- */

type Line = ["me" | "tool" | "bot", string]

const CHANNELS = ["Telegram", "WhatsApp", "Discord", "Slack", "Signal"]
const TALKS: Line[][] = [
  [
    ["me", "Add this week's invoices to Twenty."],
    ["tool", "open documents/invoices"],
    ["tool", "browser · twenty"],
    [
      "bot",
      "Done. Three new invoices are in Twenty, linked to their companies."
    ]
  ],
  [
    ["me", "Is anything down?"],
    ["tool", "check Uptime Kuma"],
    ["bot", "All 9 monitors are up. Plex restarted at 07:40 after an update."]
  ],
  [
    ["me", "Did last night's backup finish?"],
    ["tool", "read backups/nightly.log"],
    [
      "bot",
      "Yes, it finished at 03:12. 14.2 GB, with Nextcloud and Immich included."
    ]
  ]
]

interface Message {
  id: number
  kind: "me" | "tool" | "bot" | "typing"
  text: string
  done?: boolean
  old?: boolean
}

export function AssistantScene({ icons }: { icons: AppIcons }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [channel, setChannel] = useState(0)
  const [messages, setMessages] = useState<Message[]>(() =>
    TALKS[2].map(([kind, text], id) => ({ id, kind, text, done: true }))
  )
  useSceneScript(sceneRef, async (sleep) => {
    let nextId = 100
    const add = (message: Omit<Message, "id">) => {
      const id = nextId++
      setMessages((list) => [...list, { ...message, id }].slice(-14))
      return id
    }
    const update = (id: number, change: Partial<Message>) =>
      setMessages((list) =>
        list.map((message) =>
          message.id === id ? { ...message, ...change } : message
        )
      )

    for (let talk = 0; ; talk = (talk + 1) % TALKS.length) {
      await sleep(2400)
      setMessages((list) => list.map((message) => ({ ...message, old: true })))
      setChannel((current) => (current + 1) % CHANNELS.length)
      for (const [kind, text] of TALKS[talk]) {
        if (kind === "me") {
          await sleep(500)
          add({ kind, text })
          await sleep(700)
        } else if (kind === "tool") {
          const id = add({ kind, text })
          await sleep(1000)
          update(id, { done: true })
        } else {
          const id = add({ kind: "typing", text: "" })
          await sleep(1100)
          update(id, { kind: "bot", text })
        }
      }
      await sleep(3000)
    }
  })

  return (
    <Stage width={460} height={360} sceneRef={sceneRef}>
      <div
        className="ks-abs ks-chat"
        style={{ left: 60, top: 20, width: 340, height: 270 }}
      >
        <div className="ks-chat-head">
          <AppIcon
            icon={icons.OpenClaw ?? ""}
            name="OpenClaw"
            className="size-[30px] rounded-full"
          />
          <div>
            <b className="block text-[13px] leading-tight font-semibold">
              OpenClaw
            </b>
            <small className="text-xs text-kumo-subtle">
              bot · {CHANNELS[channel]}
            </small>
          </div>
        </div>
        <div className="ks-msgs">
          {messages.map((message) =>
            message.kind === "typing" ? (
              <div key={message.id} className="ks-typing">
                <i />
                <i />
                <i />
              </div>
            ) : message.kind === "tool" ? (
              <div
                key={message.id}
                className={cn(
                  "ks-tool",
                  message.done && "ks-done",
                  message.old && "ks-old"
                )}
              >
                <i />
                {message.text}
              </div>
            ) : (
              <div
                key={message.id}
                className={cn(
                  "ks-msg",
                  message.kind === "me" ? "ks-me" : "ks-bot",
                  message.old && "ks-old"
                )}
              >
                {message.text}
              </div>
            )
          )}
        </div>
      </div>
    </Stage>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hardware: two racks with blinking lights, uplinked to our routers         */
/* -------------------------------------------------------------------------- */

/** Blink timings for each rack's nine sleds: [delay, period] in seconds. */
const SLEDS = [
  [
    [0.4, 1.9],
    [1.7, 1.1],
    [0.9, 2.2],
    [1.3, 0.9],
    [0.2, 1.6],
    [1.9, 1.3],
    [0.6, 2.0],
    [1.1, 1.2],
    [1.5, 1.8]
  ],
  [
    [1.2, 1.4],
    [0.3, 2.1],
    [1.8, 1.0],
    [0.7, 1.7],
    [1.4, 2.3],
    [0.1, 1.2],
    [1.6, 1.5],
    [0.8, 0.9],
    [1.0, 2.0]
  ]
]

const light = (delay: number, period: number) =>
  ({
    "--d": `-${delay.toFixed(2)}s`,
    "--t": `${period.toFixed(2)}s`
  }) as CSSProperties

function Rack({
  name,
  x,
  sleds
}: {
  name: string
  x: number
  sleds: number[][]
}) {
  return (
    <div className="ks-rack" style={{ left: x, top: 128 }}>
      <div className="ks-rack-name">{name}</div>
      <div className="ks-rack-front">
        <div className="ks-sled ks-net">
          <i style={light(0.2, 0.7)} />
          <i style={light(0.5, 0.9)} />
          <i style={light(0.1, 0.6)} />
        </div>
        {sleds.map(([delay, period], index) => (
          <div key={index} className="ks-sled">
            <i style={light(delay, period)} />
            <i className="ks-b" style={light(delay / 2, period * 1.7)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HardwareScene({ maxSpeed }: { maxSpeed?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  usePauseOffscreen(sceneRef)

  return (
    <Stage width={460} height={360} sceneRef={sceneRef}>
      <svg viewBox="0 0 460 360" className="ks-graph">
        <path
          id="ks-u1"
          className="ks-wire"
          d="M150 128 C 150 90, 230 96, 230 58"
        />
        <path
          id="ks-u2"
          className="ks-wire"
          d="M310 128 C 310 90, 230 96, 230 58"
        />
        {[
          { path: "ks-u1", dur: "1.8s", begin: "0s", up: true },
          { path: "ks-u1", dur: "1.8s", begin: "0.9s", up: false },
          { path: "ks-u2", dur: "2.1s", begin: "0.4s", up: true },
          { path: "ks-u2", dur: "2.1s", begin: "1.3s", up: false }
        ].map((packet, index) => (
          <circle key={index} className="ks-pkt" r="3">
            <animateMotion
              dur={packet.dur}
              begin={packet.begin}
              repeatCount="indefinite"
              {...(packet.up
                ? { keyPoints: "1;0", keyTimes: "0;1", calcMode: "linear" }
                : {})}
            >
              <mpath href={`#${packet.path}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>
      <div className="ks-router">
        <span className="ks-led" />
        Our routers · peering we choose
      </div>
      <Rack name="ams-17" x={90} sleds={SLEDS[0]} />
      <Rack name="ams-42" x={250} sleds={SLEDS[1]} />
      {maxSpeed && (
        <span className="ks-wtag ks-brand" style={{ left: 262, top: 84 }}>
          up to {maxSpeed}
        </span>
      )}
    </Stage>
  )
}
