import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const directory = await mkdtemp(join(tmpdir(), "appbox-handoff-test-"))
const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
try {
  const output = join(directory, "handoff.mjs")
  await build({
    entryPoints: ["src/api/custom-buttons/browser-handoff.ts"],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "esm",
    tsconfig: "tsconfig.json"
  })
  const handoff = await import(pathToFileURL(output))
  const execution = "a".repeat(64)
  const admission = {
    execution_id: execution,
    status: "pending",
    pollRoute: `buttons/handoff/255367/${execution}`,
    origin: "https://ai.tester2.appboxes.co"
  }
  const action = "buttons/action/100/255367"
  assert.deepEqual(
    handoff.validateHandoffAdmission(admission, action),
    admission
  )
  for (const patch of [
    { pollRoute: "https://evil.test" },
    { execution_id: "../bad" },
    { origin: "http://ai.tester2.appboxes.co" },
    { origin: "https://user@evil.test" }
  ]) {
    assert.throws(() =>
      handoff.validateHandoffAdmission({ ...admission, ...patch }, action)
    )
  }
  assert.throws(() =>
    handoff.validateHandoffAdmission(admission, "buttons/action/100/1")
  )
  const secret = {
    url:
      admission.origin +
      "/#bootstrapToken=" +
      "b".repeat(43) +
      "&bootstrapProfile=owner",
    expiresAtMs: Date.now() + 60000
  }
  assert.equal(
    handoff.validateHandoffSecret(secret, admission.origin),
    secret.url
  )
  for (const patch of [
    { url: secret.url.replace(admission.origin, "https://evil.test") },
    { url: secret.url + "&token=SHARED" },
    { url: secret.url.replace("/#", "/other#") },
    { url: "javascript:alert(1)" },
    { expiresAtMs: 1 },
    { expiresAtMs: Date.now() + 700000 }
  ]) {
    assert.throws(() =>
      handoff.validateHandoffSecret({ ...secret, ...patch }, admission.origin)
    )
  }
  globalThis.window = { open: () => null }
  assert.throws(() => handoff.openHandoffWindow(), /pop-ups/)
  const popup = {
    closed: false,
    opener: {},
    document: {
      title: "",
      head: { append() {} },
      createElement: () => ({}),
      body: { textContent: "" }
    },
    location: {
      href: "about:blank",
      replace(url) {
        this.href = url
      }
    }
  }
  globalThis.window = { open: () => popup }
  assert.equal(handoff.openHandoffWindow(), popup)
  assert.equal(popup.opener, null)
  let calls = 0
  globalThis.fetch = async (url, init) => {
    calls++
    assert.equal(new URL(url).pathname, `/v1/${admission.pollRoute}`)
    assert.equal(init.method, "POST")
    assert.equal(init.cache, "no-store")
    assert.equal(init.credentials, "include")
    return Response.json({ status: "ready", secret })
  }
  assert.equal(await handoff.finishBrowserHandoff(popup, admission), undefined)
  assert.equal(popup.location.href, secret.url)
  assert.equal(calls, 1)
  assert.ok(!popup.document.body.textContent.includes("b".repeat(43)))
  popup.location.href = "about:blank"
  globalThis.fetch = async () => Response.json({ status: "expired" })
  await assert.rejects(
    handoff.finishBrowserHandoff(popup, admission),
    /Return to Appbox/
  )
  assert.ok(popup.document.body.textContent.includes("try again"))
  globalThis.fetch = async () => {
    throw new Error("SECRET_TRANSPORT_BODY")
  }
  await assert.rejects(
    handoff.finishBrowserHandoff(popup, admission),
    (error) => !error.message.includes("SECRET_TRANSPORT_BODY")
  )
  popup.closed = true
  globalThis.fetch = async () => {
    assert.fail("Closed popup must not fetch")
  }
  await handoff.finishBrowserHandoff(popup, admission)
  console.log(
    "Browser handoff validation, popup, no-store delivery and failure checks passed."
  )
} finally {
  globalThis.fetch = originalFetch
  globalThis.window = originalWindow
  await rm(directory, { recursive: true, force: true })
}
