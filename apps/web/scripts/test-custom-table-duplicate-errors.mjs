import assert from "node:assert/strict"
import { build } from "esbuild"

const result = await build({
  entryPoints: [new URL("../src/api/custom-tables/custom-tables.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  target: "node23",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
})
const source = Buffer.from(result.outputFiles[0].contents).toString("base64")
const { addCustomTableRow, updateCustomTableRow, isDuplicateCustomTableValueError } =
  await import(`data:text/javascript;base64,${source}`)
const originalFetch = globalThis.fetch

try {
  for (const mutate of [
    () => addCustomTableRow(12, 262230, { "name:value": "example" }),
    () => updateCustomTableRow(12, 262230, 31, { "name:value": "example" })
  ]) {
    for (const [status, message, expected] of [
      [404, "Data: Duplicate data", true],
      [404, "Custom table value already exists.", true],
      [404, "Data: Not Found", false],
      [500, "Internal server error.", false],
      [500, "Custom table value already exists.", false],
      [403, "Permission denied", false],
      [404, "Custom table value already exists. secret=do-not-display", false]
    ]) {
      globalThis.fetch = async () => new Response(
        JSON.stringify({ error: { status, message } }),
        { status, headers: { "content-type": "application/json" } }
      )
      await assert.rejects(mutate, (error) => {
        assert.equal(isDuplicateCustomTableValueError(error), expected)
        return true
      })
    }
  }
  assert.equal(isDuplicateCustomTableValueError(new Error("Data: Duplicate data")), false)
  assert.equal(isDuplicateCustomTableValueError(null), false)
  console.log("Custom Table duplicate error checks passed (mocked HTTP; no live requests)")
} finally {
  globalThis.fetch = originalFetch
}
