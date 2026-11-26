import assert from "node:assert/strict"
import { build } from "esbuild"

const result = await build({
  entryPoints: [new URL("../src/api/custom-tables/mutation-notices.ts", import.meta.url).pathname],
  bundle: true, write: false, platform: "node", format: "esm", target: "node23"
})
const source = Buffer.from(result.outputFiles[0].contents).toString("base64")
const { customTableMutationRowLabel: label } =
  await import(`data:text/javascript;base64,${source}`)

const column = { name: "name:value", title: "Repository", type: "dynamicText" }
const rows = [{ id: "42", "name:value": "release-added", "password:value": "never-display" }]
assert.equal(label(42, rows, [column]), "release-added")
assert.equal(label(41, rows, [column]), null)
assert.equal(label(42, rows, []), null)
assert.equal(label(42, rows, [{ ...column, sensitive: true }]), null)
for (const type of ["password", "passwordAlphaNumeric", "complexPassword"]) {
  assert.equal(label(42, rows, [{ ...column, type }]), null)
  assert.equal(label(42, rows, [{ ...column, inputField: { type } }]), null)
}
for (const value of ["", "   ", "[REDACTED]", null, {}, 123]) {
  assert.equal(label(42, [{ id: 42, "name:value": value }], [column]), null)
}
assert.equal(label(42, rows, [{ name: "password:value", title: "Password" }]), null)
assert.equal(label(42, [{ id: 42, name: "named-row" }], [{ ...column, name: "name" }]), "named-row")
console.log("Custom Table mutation notice label checks passed (no live requests)")
