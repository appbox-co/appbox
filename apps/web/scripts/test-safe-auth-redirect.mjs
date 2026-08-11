import assert from "node:assert/strict"
import { mkdir, rm } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = new URL("../.tmp-tests/", import.meta.url)
const outputFile = new URL("./safe-auth-redirect.mjs", outputDir)

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

await build({
  entryPoints: [
    new URL("../src/lib/auth/safe-redirect.ts", import.meta.url).pathname
  ],
  outfile: outputFile.pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node23",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
})

const { getSafeAuthRedirect } = await import(pathToFileURL(outputFile.pathname))
const fallback = "/dashboard"

try {
  assert.equal(getSafeAuthRedirect(null), fallback)
  assert.equal(getSafeAuthRedirect(""), fallback)
  assert.equal(getSafeAuthRedirect("https://attacker.example"), fallback)
  assert.equal(getSafeAuthRedirect("//attacker.example"), fallback)
  assert.equal(getSafeAuthRedirect(String.raw`/\attacker.example`), fallback)
  assert.equal(getSafeAuthRedirect("/\t/attacker.example"), fallback)
  assert.equal(getSafeAuthRedirect("/\n/attacker.example"), fallback)
  assert.equal(getSafeAuthRedirect("/\r/attacker.example"), fallback)
  assert.equal(
    getSafeAuthRedirect(
      new URLSearchParams("redirect=%2F%5Cattacker.example").get("redirect")
    ),
    fallback
  )
  assert.equal(
    getSafeAuthRedirect(
      new URLSearchParams("redirect=%2F%09%2Fattacker.example").get("redirect")
    ),
    fallback
  )

  const internalRedirect = "/appstore/app/nextcloud?plan=monthly#install"
  assert.equal(getSafeAuthRedirect(internalRedirect), internalRedirect)

  const baseUrl = new URL("https://www.appbox.co/login")
  for (const candidate of [
    String.raw`/\attacker.example`,
    "/\t/attacker.example",
    "/\n/attacker.example",
    "/\r/attacker.example"
  ]) {
    const safeRedirect = getSafeAuthRedirect(candidate)
    assert.equal(new URL(safeRedirect, baseUrl).origin, baseUrl.origin)
  }
} finally {
  await rm(outputDir, { force: true, recursive: true })
}
