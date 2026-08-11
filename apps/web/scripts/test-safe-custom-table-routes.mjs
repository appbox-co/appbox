import assert from "node:assert/strict"
import { mkdir, rm } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = new URL("../.tmp-tests/", import.meta.url)
const outputFile = new URL("./safe-custom-table-routes.mjs", outputDir)

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

await build({
  entryPoints: [
    new URL("../src/api/custom-tables/custom-tables.ts", import.meta.url)
      .pathname
  ],
  outfile: outputFile.pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node23",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
})

const { runCustomTableRowAction } = await import(
  pathToFileURL(outputFile.pathname)
)
const originalFetch = globalThis.fetch
const requests = []

globalThis.fetch = async (input, init) => {
  requests.push({ init, url: String(input) })
  return new Response(null, { status: 204 })
}

const action = {
  name: "restart",
  label: "Restart",
  APIRoute: "services/{row.service_name}/restart",
  APIMethod: "post"
}

try {
  await runCustomTableRowAction(action, {
    id: 1,
    service_name: "../../target"
  })

  assert.equal(requests.length, 1)
  assert.equal(
    requests[0].url,
    "https://api.appbox.co/v1/services/..%2F..%2Ftarget/restart"
  )

  for (const value of [".", ".."]) {
    await assert.rejects(
      runCustomTableRowAction(action, { id: 1, service_name: value }),
      /Invalid custom table row route segment/
    )
  }

  assert.equal(requests.length, 1)
} finally {
  globalThis.fetch = originalFetch
  await rm(outputDir, { force: true, recursive: true })
}
