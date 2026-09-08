import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = await mkdtemp(join(tmpdir(), "notification-lifecycle-"))
try {
  const outputFile = join(outputDir, "helper.mjs")
  await build({
    entryPoints: [new URL("../src/components/dashboard/notification-helpers.tsx", import.meta.url).pathname],
    outfile: outputFile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node23",
    tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
  })
  const { getNotificationSubtext } = await import(pathToFileURL(outputFile))
  const calls = []
  const t = (key) => { calls.push(key); return key }
  for (const action of ["start", "stop", "restart"]) {
    assert.equal(getNotificationSubtext(t, "instance", action), null)
  }
  assert.deepEqual(calls, [], "Lifecycle actions must not translate success text")
  assert.equal(getNotificationSubtext(t, "instance", "updated"), "subtext.instance_updated")
  assert.equal(getNotificationSubtext(t, "cylo", "restarted"), "subtext.cylo_restarted")
  assert.equal(getNotificationSubtext(t, "instance", "unknown"), null)
  console.log("Notification lifecycle subtext checks passed")
} finally {
  await rm(outputDir, { recursive: true, force: true })
}
