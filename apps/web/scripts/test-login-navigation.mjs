import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import { build, transform } from "esbuild"

const require = createRequire(import.meta.url)
const webRoot = fileURLToPath(new URL("../", import.meta.url))
const pageFile = new URL(
  "../src/app/[locale]/(auth)/login/page.tsx",
  import.meta.url
)

// Use the real locale routing and redirect validation with the login component.
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { getPathname, routing } from "./src/i18n/routing"
      export { getSafeAuthRedirect } from "./src/lib/auth/safe-redirect"
    `,
    resolveDir: webRoot
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
})
const helpers = { exports: {} }
runInNewContext(outputFiles[0].text, {
  module: helpers,
  exports: helpers.exports,
  require,
  process,
  URL,
  URLSearchParams,
  TextEncoder,
  TextDecoder,
  setTimeout,
  clearTimeout
})

const { code } = await transform(await readFile(pageFile, "utf8"), {
  loader: "tsx",
  jsx: "automatic",
  format: "cjs"
})

function createLogin({ locale = "en", redirect = null } = {}) {
  const state = {
    values: [],
    cursor: 0,
    requests: [],
    hardNavigations: [],
    softNavigations: [],
    replies: [],
    submit: null
  }
  const schema = new Proxy(() => schema, { get: () => schema })
  const element = (type, props) => ({ type, props })
  const modules = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => {
        const index = state.cursor++
        if (!(index in state.values)) state.values[index] = initial
        return [
          state.values[index],
          (value) => {
            state.values[index] =
              typeof value === "function" ? value(state.values[index]) : value
          }
        ]
      }
    },
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "next-intl": {
      useLocale: () => locale,
      useTranslations: () => (key) => key
    },
    "next/navigation": {
      useSearchParams: () =>
        new URLSearchParams(redirect === null ? {} : { redirect })
    },
    "@hookform/resolvers/zod": { zodResolver: () => undefined },
    "input-otp": { REGEXP_ONLY_DIGITS_AND_CHARS: "^[a-zA-Z0-9]+$" },
    "lucide-react": { Info: "Info", Loader2: "Loader2" },
    "react-hook-form": {
      useForm: () => ({
        handleSubmit: (submit) => {
          state.submit = submit
          return submit
        },
        register: () => ({}),
        formState: { errors: {} }
      })
    },
    sonner: { toast: { success: () => {}, error: () => {} } },
    zod: { z: schema },
    "@/i18n/routing": {
      ...helpers.exports,
      Link: "Link",
      useRouter: () => ({ replace: (path) => state.softNavigations.push(path) })
    },
    "@/lib/auth/safe-redirect": helpers.exports,
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") }
  }
  const page = { exports: {} }
  runInNewContext(code, {
    module: page,
    exports: page.exports,
    require: (name) => {
      if (name in modules) return modules[name]
      if (name.startsWith("@/components/ui/")) {
        return new Proxy({}, { get: (_target, key) => key })
      }
      throw new Error(`Unexpected dependency: ${name}`)
    },
    window: {
      location: { replace: (path) => state.hardNavigations.push(path) }
    },
    fetch: async (url, options) => {
      state.requests.push({ url, body: JSON.parse(options.body) })
      const reply = state.replies.shift()
      assert.ok(reply, "Every request must have a simulated response")
      return { ok: reply.ok ?? true, json: async () => reply.body }
    }
  })
  state.render = () => {
    state.cursor = 0
    return page.exports.default()
  }
  state.render()
  return state
}

function findElement(node, predicate) {
  if (!node || typeof node !== "object") return null
  if (predicate(node)) return node
  const children = Array.isArray(node) ? node : [node.props?.children]
  for (const child of children) {
    const result = findElement(child, predicate)
    if (result) return result
  }
  return null
}

async function submitPassword(state, body, ok = true) {
  state.replies.push({ body, ok })
  await state.submit({ email: "test@example.invalid", password: "test-only" })
}

async function submitCode(
  state,
  { recovery = false, exhausted = false, ok = true } = {}
) {
  await submitPassword(state, {
    two_factor_required: true,
    two_factor_token: "test-challenge"
  })
  assert.deepEqual(
    state.hardNavigations,
    [],
    "Password verification alone must not navigate past 2FA"
  )
  let tree = state.render()
  if (recovery) {
    findElement(tree, (node) => node.type === "button").props.onClick()
    tree = state.render()
  }
  state.replies.push({
    ok,
    body: { success: ok, recovery_codes_exhausted: exhausted }
  })
  findElement(tree, (node) => node.type === "InputOTP").props.onChange(
    recovery ? "ABCD1234" : "123456"
  )
  await new Promise(setImmediate)
  assert.equal(state.requests.at(-1).body.use_recovery, recovery)
}

const cases = [
  { label: "password login", options: {}, expected: "/dashboard" },
  { label: "2FA login", options: {}, twoFactor: {}, expected: "/dashboard" },
  {
    label: "recovery login",
    options: {},
    twoFactor: { recovery: true },
    expected: "/dashboard"
  },
  {
    label: "exhausted recovery codes",
    options: {},
    twoFactor: { recovery: true, exhausted: true },
    expected: "/account/2fa-setup"
  },
  {
    label: "selected language",
    options: { locale: "de" },
    twoFactor: {},
    expected: "/de/dashboard"
  },
  {
    label: "localized recovery setup",
    options: { locale: "fr" },
    twoFactor: { exhausted: true },
    expected: "/fr/account/2fa-setup"
  },
  {
    label: "return URL query and fragment",
    options: { redirect: "/appstore/app/nextcloud?plan=monthly#install" },
    expected: "/appstore/app/nextcloud?plan=monthly#install"
  },
  {
    label: "existing locale prefix",
    options: { locale: "de", redirect: "/de/dashboard?tab=apps#top" },
    expected: "/de/dashboard?tab=apps#top"
  },
  {
    label: "external redirect rejected",
    options: { redirect: "https://example.invalid/", locale: "de" },
    expected: "/de/dashboard"
  },
  {
    label: "backslash redirect rejected",
    options: { redirect: String.raw`/\example.invalid` },
    expected: "/dashboard"
  }
]
for (const { label, options, twoFactor, expected } of cases) {
  const state = createLogin(options)
  if (twoFactor) await submitCode(state, twoFactor)
  else await submitPassword(state, { success: true })
  assert.deepEqual(state.hardNavigations, [expected], label)
  assert.deepEqual(
    state.softNavigations,
    [],
    `${label} must replace the document`
  )
}
for (const twoFactor of [false, true]) {
  const state = createLogin()
  if (twoFactor) await submitCode(state, { ok: false })
  else await submitPassword(state, { error: "Invalid credentials" }, false)
  assert.deepEqual(
    state.hardNavigations,
    [],
    "Failed authentication must not navigate"
  )
  assert.deepEqual(
    state.softNavigations,
    [],
    "Failed authentication must not navigate"
  )
}
console.log("Passed 12 login navigation scenarios.")
