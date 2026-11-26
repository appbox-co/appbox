import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import vm from "node:vm"
import ts from "typescript"

// Execute the real mapping, hooks and JSX with inert dependencies. No server,
// credentials, guest commands, DOM or production API calls are used by this test.
const root = new URL("../", import.meta.url)
const kumo = "src/app/(kumo)/[locale]/kumo/_components/"
const calls = []
let stateOverride = (value) => value
let pendingMutation = ""
const mutation = (name) => ({
  isPending: name === pendingMutation,
  mutate: (...args) => calls.push([name, ...args]),
  mutateAsync: async (...args) => calls.push([name, ...args])
})
const tags = new Proxy({}, { get: (_target, name) => String(name) })
const jsx = (type, props) => ({ type, props: props ?? {} })
const hooks = new Proxy(
  {},
  {
    get: (_target, name) => {
      if (name === "useCylo") return () => ({ data: { status: "online" } })
      if (name === "useCustomButtons") return () => ({ data: [] })
      return () => mutation(name)
    }
  }
)
let control
function requireStub(name) {
  if (name === "react/jsx-runtime")
    return { jsx, jsxs: jsx, Fragment: "Fragment" }
  if (name === "react")
    return {
      useState: (initial) => [stateOverride(initial), () => {}],
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useEffect: () => {}
    }
  if (name === "next-intl") return { useTranslations: () => (key) => key }
  if (name.includes("auth-provider"))
    return { useAuth: () => ({ isAdmin: true, user: { id: 2 } }) }
  if (name.includes("launch-week-flags"))
    return { isLaunchWeekEnabled: () => true }
  if (name === "@tanstack/react-query")
    return { useQuery: (options) => options }
  if (name.includes("query-keys"))
    return {
      queryKeys: {
        installedApps: {
          all: ["installedApps"],
          detail: (id) => ["installedApps", id],
          byCylo: (id) => ["cylo", id]
        }
      }
    }
  if (name === "./vm-control") return control
  if (name.includes("/hooks/")) return hooks
  if (name === "@/lib/utils")
    return { cn: (...values) => values.filter(Boolean).join(" ") }
  if (name === "@/lib/install-validation")
    return { fieldConditionsMet: () => true }
  if (name === "./actions-logic")
    return load(kumo + "installed/actions-logic.ts")
  if (name === "@/api/client")
    return new Proxy(
      {},
      { get: () => () => assert.fail("No API calls in this test") }
    )
  return tags
}

function load(relative, extras = "") {
  const path = fileURLToPath(new URL(relative, root))
  const source = readFileSync(path, "utf8")
  const result = ts.transpileModule(source + "\n" + extras, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX
    }
  })
  assert.equal(
    (result.diagnostics ?? []).filter(
      (d) => d.category === ts.DiagnosticCategory.Error
    ).length,
    0
  )
  const exports = {}
  vm.runInNewContext(
    result.outputText,
    { exports, require: requireStub, console, URL, setTimeout, clearTimeout },
    { filename: path }
  )
  return exports
}

function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten)
  if (!node || typeof node !== "object") return []
  // Kumo's Tooltip takes its trigger through the render prop.
  return [
    node,
    ...flatten(node.props?.children),
    ...flatten(node.props?.render)
  ]
}
function label(node) {
  if (Array.isArray(node)) return node.map(label).join("")
  if (typeof node === "string" || typeof node === "number") return String(node)
  return node && typeof node === "object" ? label(node.props?.children) : ""
}
function buttons(tree) {
  return flatten(tree).filter((node) => node.type === "Button")
}
// Kumo's confirmation dialogs take their confirm button as props.
function confirmations(tree) {
  return flatten(tree)
    .filter((node) => node.type === "ActionDialog")
    .map((node) => ({
      type: "Button",
      props: {
        disabled: node.props.confirmDisabled,
        onClick: node.props.onConfirm,
        children: node.props.confirmLabel
      }
    }))
}

control = load("src/api/installed-apps/vm-control.ts")
const api = load(
  "src/api/installed-apps/installed-apps.ts",
  "exports.testMap = mapInstalledApp"
)
const raw = {
  id: 261996,
  app: { type: "vm" },
  windows_preshutdown_enabled: true,
  enabled: 1,
  state: 1
}
// Linux/unknown VMs and non-opted-in Windows retain their pre-change UI.
// A raw pending status or a Windows-looking label must not opt them in.
for (const capability of [undefined, null, false, 0, 1, "true"]) {
  for (const status of ["queued", "executing", "unknown", "accepted"]) {
    const legacy = api.testMap({
      ...raw,
      display_name: "Windows 11",
      windows_preshutdown_enabled: capability,
      vm_control_status: status,
      vm_control_action: "stop",
      vm_control_pending: true
    })
    assert.equal(legacy.windows_preshutdown_enabled, false)
    assert.equal(legacy.vm_control_pending, false)
  }
}
for (const status of ["queued", "executing", "unknown"]) {
  for (const action of ["start", "stop", "restart"]) {
    assert.equal(
      api.testMap({
        ...raw,
        vm_control_status: status,
        vm_control_action: action
      }).vm_control_pending,
      true
    )
  }
}
assert.equal(
  api.testMap({
    ...raw,
    vm_control_status: "accepted",
    vm_control_action: "stop"
  }).vm_control_pending,
  true
)
assert.equal(
  api.testMap({
    ...raw,
    vm_control_status: "accepted",
    vm_control_action: "restart"
  }).vm_control_pending,
  false,
  "Legacy accepted restart must not remain stuck"
)
for (const value of [true, 1, "1", "true", " TRUE "]) {
  assert.equal(
    api.testMap({
      ...raw,
      vm_control_pending: value,
      vm_control_status: "accepted",
      vm_control_action: "restart"
    }).vm_control_pending,
    true
  )
}
for (const value of [undefined, null, false, 0, "0", "false", "", "unknown"]) {
  assert.equal(
    api.testMap({ ...raw, vm_control_pending: value }).vm_control_pending,
    false
  )
}
for (const status of ["accepted", "completed", "failed", null]) {
  assert.equal(
    api.testMap({
      ...raw,
      vm_control_status: status,
      vm_control_action: "restart",
      vm_control_pending: false
    }).vm_control_pending,
    false
  )
}
assert.equal(
  api.testMap({
    ...raw,
    app: { type: "docker" },
    vm_control_pending: true,
    vm_control_status: "executing"
  }).vm_control_pending,
  false
)
assert.equal(
  api.testMap({ ...raw, vm_control_pending: true }).status,
  "online",
  "Pending state must not invent a guest power state"
)
assert.equal(
  "vm_control_token" in
    api.testMap({ ...raw, vm_control_token: "not-a-client-field" }),
  false
)

const app = {
  ...api.testMap(raw),
  version: "1",
  default_version: "2",
  can_update: true,
  allow_downgrade: true,
  available_versions: [
    { id: 1, version: "1" },
    { id: 2, version: "2" },
    { id: 3, version: "3" }
  ]
}
const { AppActions } = load(kumo + "installed/app-actions.tsx")
for (const status of ["online", "offline", "inactive", "frozen"]) {
  stateOverride = (value) =>
    typeof value === "boolean" ? true : value === "" ? "3" : value
  const tree = AppActions({ app: { ...app, status, vm_control_pending: true } })
  const controls = [...buttons(tree), ...confirmations(tree)].filter(
    (node) => label(node) !== "Cancel"
  )
  assert.ok(controls.length >= 9)
  for (const button of controls)
    assert.equal(
      button.props.disabled,
      true,
      `Pending ${status}: ${label(button)} remains enabled`
    )
  assert.ok(
    flatten(tree).some(
      (node) =>
        node.props?.role === "status" && label(node) === "vmControlPending"
    )
  )
  assert.equal(
    flatten(tree).find((node) => node.type === "Select").props.disabled,
    true
  )
  calls.length = 0
  for (const button of controls.filter(
    (node) => label(node) === "Confirm" || label(node) === "uninstall"
  ))
    button.props.onClick?.()
  assert.equal(
    calls.length,
    0,
    "Previously opened confirmation must not dispatch after pending status arrives"
  )
}
stateOverride = (value) => value
let tree = AppActions({ app: { ...app, vm_control_pending: false } })
assert.equal(
  Boolean(
    buttons(tree).find((node) => label(node) === "restart").props.disabled
  ),
  false
)
pendingMutation = "useStopApp"
tree = AppActions({ app })
assert.equal(
  buttons(tree).find((node) => label(node) === "restart").props.disabled,
  true,
  "An in-flight VM stop must disable restart"
)
tree = AppActions({
  app: { ...app, windows_preshutdown_enabled: false, vm_control_pending: false }
})
assert.equal(
  Boolean(
    buttons(tree).find((node) => label(node) === "restart").props.disabled
  ),
  false,
  "The Windows-only in-flight guard must not alter legacy/Linux controls"
)
pendingMutation = ""

const { BoostCard } = load(kumo + "installed/boost-card.tsx")
stateOverride = (value) => (typeof value === "number" ? value + 1 : value)
tree = BoostCard({ app: { ...app, vm_control_pending: true } })
assert.equal(
  flatten(tree).find((node) => node.type === "BoostSlider").props.disabled,
  true
)
const apply = buttons(tree).find((node) => label(node) === "boost.apply")
assert.equal(apply.props.disabled, true)
calls.length = 0
apply.props.onClick()
assert.equal(calls.length, 0)
stateOverride = (value) => value

// Every Kumo list with power controls (installed apps, an Appbox's apps, an
// app's instances) renders the shared row and bulk controls, so execute those,
// including the bulk runner on mixed pending/non-pending selections.
for (const relative of [
  "installed/installed-apps-list.tsx",
  "appstore/app-instances.tsx"
]) {
  const text = readFileSync(new URL(kumo + relative, root), "utf8")
  for (const usage of [
    "<InstanceRowActions",
    "<InstanceBulkActions",
    "useInstanceRunner("
  ])
    assert.ok(text.includes(usage), `${relative}: ${usage} must be used`)
}
const {
  INSTANCE_ACTIONS,
  InstanceBulkActions,
  InstanceRowActions,
  canRunInBulk,
  // Called outside React here; its useState is the stub above.
  useInstanceRunner: createInstanceRunner
} = load(kumo + "installed/instance-controls.tsx")
for (const status of ["online", "offline", "inactive", "frozen"]) {
  const held = { ...app, status, vm_control_pending: true }
  const rowButtons = buttons(InstanceRowActions({ app: held, onRun: () => {} }))
  assert.equal(rowButtons.length, 4)
  for (const button of rowButtons)
    assert.equal(button.props.disabled, true, "pending row action enabled")
  const bulkButtons = buttons(
    InstanceBulkActions({ apps: [held], bulk: null, onRun: () => {} })
  )
  assert.equal(bulkButtons.length, 5, "all five bulk buttons must be tested")
  for (const button of bulkButtons)
    assert.equal(button.props.disabled, true, "pending bulk action enabled")
  for (const action of INSTANCE_ACTIONS)
    assert.equal(canRunInBulk(action, held), false)
}
for (const action of INSTANCE_ACTIONS) {
  assert.equal(
    canRunInBulk(action, {
      ...app,
      status: "online",
      vm_control_pending: true
    }),
    false
  )
  assert.equal(
    canRunInBulk(action, {
      ...app,
      status: "frozen",
      vm_control_pending: true
    }),
    false
  )
  const eligible =
    action === "start" ? "offline" : action === "unfreeze" ? "frozen" : "online"
  assert.equal(
    canRunInBulk(action, {
      ...app,
      status: eligible,
      vm_control_pending: false
    }),
    true
  )
}
const runner = createInstanceRunner(async (action, ids) => {
  calls.push([action, ids])
})
calls.length = 0
for (const action of INSTANCE_ACTIONS)
  await runner.runBulk(action, [
    { ...app, id: 1, status: "online", vm_control_pending: true },
    { ...app, id: 2, status: "frozen", vm_control_pending: true }
  ])
assert.equal(calls.length, 0, "Pending installs must not be sent in bulk")
await runner.runBulk("stop", [
  { ...app, id: 1, status: "online", vm_control_pending: true },
  { ...app, id: 2, status: "online", vm_control_pending: false }
])
assert.deepEqual(calls, [["stop", [2]]])

// The page hides AppActions for inactive-but-not-yet-off VMs. Render its real
// fallback paragraph so a protected Stop keeps the specific pending message.
const detailPage = kumo + "installed/installed-app-view.tsx"
const detailSource = readFileSync(new URL(detailPage, root), "utf8")
const detailAst = ts.createSourceFile(
  detailPage,
  detailSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
)
const unavailableParagraphs = []
function visitDetail(node) {
  if (
    ts.isJsxElement(node) &&
    node.openingElement.tagName.getText(detailAst) === "p" &&
    node.getText(detailAst).includes('"actionsUnavailable"')
  ) {
    unavailableParagraphs.push(node.getText(detailAst))
  }
  ts.forEachChild(node, visitDetail)
}
visitDetail(detailAst)
assert.equal(unavailableParagraphs.length, 1)
const unavailable = load(
  detailPage,
  `exports.testUnavailable = (app) => { const t = (key) => key; return (${unavailableParagraphs[0]}); };`
)
for (const [capability, pending, expected] of [
  [true, true, "vmControlPending"],
  [true, false, "actionsUnavailable"],
  [false, true, "actionsUnavailable"],
  [undefined, true, "actionsUnavailable"]
]) {
  const stopped = api.testMap({
    ...raw,
    enabled: 0,
    state: 1,
    windows_preshutdown_enabled: capability,
    vm_control_pending: pending
  })
  const message = unavailable.testUnavailable(stopped)
  assert.equal(label(message), expected)
  assert.equal(
    message.props.role,
    expected === "vmControlPending" ? "status" : undefined
  )
}

const queries = load("src/api/installed-apps/hooks/use-installed-apps.ts")
// The current design's screens pass no option and keep a single fetch.
assert.equal(queries.useInstalledApp(261996).refetchInterval, undefined)
assert.equal(queries.useInstalledApps(11350).refetchInterval, undefined)
// Kumo's screens with VM power controls opt in.
const detail = queries.useInstalledApp(261996, { watchVmControl: true })
const list = queries.useInstalledApps(11350, undefined, {
  watchVmControl: true
})
assert.equal(detail.refetchInterval({ state: { data: app } }), 5000)
assert.equal(
  detail.refetchInterval({ state: { data: { ...app, app_type: "docker" } } }),
  false
)
assert.equal(list.refetchInterval({ state: { data: [app] } }), 5000)
assert.equal(list.refetchInterval({ state: { data: [] } }), false)
for (const capability of [undefined, false]) {
  const legacy = { ...app, windows_preshutdown_enabled: capability }
  assert.equal(detail.refetchInterval({ state: { data: legacy } }), false)
  assert.equal(list.refetchInterval({ state: { data: [legacy] } }), false)
}
assert.equal(
  list.refetchInterval({ state: { data: [{ ...app, app_type: "docker" }] } }),
  false
)
console.log(
  "Windows-only pending mapping, Kumo detail/confirmation controls, boost, row/bulk paths and opt-in refresh checks passed"
)
