"use client"

import { useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Select } from "@cloudflare/kumo"
import type { ApiKey } from "@/api/account/account"
import { ApiError } from "@/api/client"
import { ROUTES } from "@/constants/routes"
import { usePathname, useRouter } from "@/i18n/routing"
import { sampleReauth } from "../../_lib/sample-reauth"
import { ApiKeysView } from "../../../_components/account/api-keys-view"
import type { Reauth } from "../../../_components/account/recent-auth"
import { AppShell } from "../../../_components/app-shell"
import { buildSearchGroups } from "../../../_components/quick-search"
import type { Loadable } from "../../../_components/shared"
import { appsByCylo, cylos, demoUser } from "../../fixtures"

/** States the page has to handle that the sample data does not otherwise reach. */
const STATES = [
  { value: "normal", label: "Five keys" },
  { value: "empty", label: "No keys" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Failed to load" },
  { value: "reauth-list", label: "Sign-in needed to list" },
  { value: "reauth-write", label: "Sign-in needed to change" }
] as const

type SampleState = (typeof STATES)[number]["value"]

const HOUR = 3_600_000
const DAY = 24 * HOUR
// Midnight, so the server render and the browser agree on every date.
const LOADED_AT = Math.floor(Date.now() / DAY) * DAY

const at = (offset: number) => new Date(LOADED_AT + offset).toISOString()

function sampleKey(
  id: number,
  name: string,
  prefix: string,
  createdDaysAgo: number,
  fields: Partial<ApiKey>
): ApiKey {
  return {
    id,
    user_id: 1,
    name,
    key_prefix: prefix,
    created_at: at(-createdDaysAgo * DAY),
    updated_at: at(-createdDaysAgo * DAY),
    last_used_at: null,
    expires_at: null,
    revoked_at: null,
    scopes: ["apps:read"],
    ...fields
  }
}

/** One key in each condition the table has to show. */
const SAMPLE: ApiKey[] = [
  // Works, in regular use, never expires.
  sampleKey(1, "Automation script", "abx_s4mp1e", 210, {
    last_used_at: at(-2 * HOUR)
  }),
  // Works, but not for much longer.
  sampleKey(2, "Home Assistant", "abx_h0m3as", 87, {
    last_used_at: at(-3 * DAY),
    expires_at: at(3 * DAY + 9 * HOUR)
  }),
  // Works and has never been used.
  sampleKey(3, "Backup job (new NAS)", "abx_b4ckup", 1, {}),
  // Ran out.
  sampleKey(4, "Grafana dashboard", "abx_gr4f4n", 400, {
    last_used_at: at(-6 * DAY),
    expires_at: at(-5 * DAY)
  }),
  // Switched off by hand.
  sampleKey(5, "Old laptop", "abx_0ldl4p", 720, {
    last_used_at: at(-320 * DAY),
    revoked_at: at(-300 * DAY)
  })
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A made-up secret, plainly not a real one. */
function sampleSecret() {
  const tail = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("")
  return `abx_sample_${tail}`
}

/** What the API answers when the sign-in is too old for the change asked of it. */
const refused = () =>
  new ApiError(403, "Forbidden", "Recent authentication is required")

/**
 * The page in one sample state. Every action changes local state only;
 * nothing typed here is sent anywhere.
 */
function SampleApiKeys({ state }: { state: SampleState }) {
  const [keys, setKeys] = useState<ApiKey[]>(state === "empty" ? [] : SAMPLE)
  // Whether "signing in again" has happened, in the two states that ask for it.
  const [signedIn, setSignedIn] = useState(false)
  const signedInRef = useRef(false)
  const nextId = useRef(100)

  const reauth: Reauth = async (request) => {
    const result = await sampleReauth(request)
    if (result.ok && !result.two_factor_required) {
      signedInRef.current = true
    }
    return result
  }

  /** In the "sign-in needed to change" state, writes are refused until then. */
  const write = async () => {
    await wait(600)
    if (state === "reauth-write" && !signedInRef.current) throw refused()
  }

  const listRefused = state === "reauth-list" && !signedIn
  const loadable: Loadable<ApiKey[]> =
    state === "loading"
      ? { status: "loading" }
      : state === "error" || listRefused
        ? { status: "error" }
        : { status: "ready", data: keys }

  return (
    <ApiKeysView
      keys={loadable}
      recentAuthRequired={listRefused}
      onCreate={async (input) => {
        await write()
        const now = new Date().toISOString()
        const key = sampleSecret()
        const item: ApiKey = {
          id: nextId.current++,
          user_id: 1,
          name: input.name,
          key_prefix: key.slice(0, 10),
          created_at: now,
          updated_at: now,
          last_used_at: null,
          expires_at: input.expires_at ?? null,
          revoked_at: null,
          scopes: input.scopes
        }
        setKeys((current) => [...current, item])
        return { key, item }
      }}
      onRename={async (id, name) => {
        await write()
        setKeys((current) =>
          current.map((key) =>
            key.id === id
              ? { ...key, name, updated_at: new Date().toISOString() }
              : key
          )
        )
      }}
      onRevoke={async (id) => {
        await write()
        setKeys((current) =>
          current.map((key) =>
            key.id === id
              ? { ...key, revoked_at: new Date().toISOString() }
              : key
          )
        )
      }}
      // Called once the sign-in went through with nothing waiting on it.
      onRefresh={() => setSignedIn(signedInRef.current)}
      reauth={reauth}
    />
  )
}

/** The API keys page on sample data. */
export function DemoApiKeys() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const requested = searchParams.get("state")
  const state: SampleState =
    STATES.find((entry) => entry.value === requested)?.value ?? "normal"

  return (
    <AppShell
      demo
      width="wide"
      title="API keys"
      currentDesignHref={ROUTES.API_KEYS}
      user={demoUser}
      search={buildSearchGroups(cylos, appsByCylo, true)}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Sample page only: a way to see the states real data rarely shows. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-kumo-line px-4 py-2.5">
          <span className="text-kumo-subtle">Sample state</span>
          <Select
            aria-label="Sample state"
            size="sm"
            className="w-60"
            value={state}
            onValueChange={(value) =>
              router.replace(
                value && value !== "normal"
                  ? `${pathname}?state=${String(value)}`
                  : pathname
              )
            }
            renderValue={(value) =>
              STATES.find((entry) => entry.value === value)?.label
            }
          >
            {STATES.map((entry) => (
              <Select.Option key={entry.value} value={entry.value}>
                {entry.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Keyed by state, so each one starts from its own sample data. */}
        <SampleApiKeys key={state} state={state} />
      </div>
    </AppShell>
  )
}
