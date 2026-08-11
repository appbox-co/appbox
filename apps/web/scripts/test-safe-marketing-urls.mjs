import assert from "node:assert/strict"
import { mkdir, rm } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = new URL("../.tmp-tests/", import.meta.url)
const outputFile = new URL("./safe-marketing-urls.mjs", outputDir)

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

await build({
  entryPoints: [
    new URL("../src/lib/marketing/safe-urls.ts", import.meta.url).pathname
  ],
  outfile: outputFile.pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node23",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname
})

const { isDeployPath, isSafeInternalPath, isSafeLinkUrl, isSafeMarkdownHref } =
  await import(pathToFileURL(outputFile.pathname))

try {
  const mixedSlashPath = String.raw`/\attacker.example`
  const appboxUrl = new URL("https://www.appbox.co/apps/nextcloud")
  const encodedMixedSlashPath = new URLSearchParams(
    "href=%2F%5Cattacker.example"
  ).get("href")
  const controlCharacterPaths = [
    "/\t/attacker.example",
    "/\n/attacker.example",
    "/\r/attacker.example"
  ]

  for (const value of [
    mixedSlashPath,
    encodedMixedSlashPath,
    ...controlCharacterPaths
  ]) {
    assert.equal(isSafeInternalPath(value), false)
    assert.equal(isSafeLinkUrl(value), false)
    assert.equal(isSafeMarkdownHref(value), false)
  }

  assert.equal(isSafeInternalPath("//attacker.example"), false)
  assert.equal(isSafeInternalPath("https://attacker.example"), false)
  assert.equal(isDeployPath(String.raw`/\attacker.example/app/`), false)
  assert.notEqual(new URL(mixedSlashPath, appboxUrl).origin, appboxUrl.origin)

  const internalPath = "/appstore/app/nextcloud?plan=monthly#install"
  assert.equal(isSafeInternalPath(internalPath), true)
  assert.equal(isSafeLinkUrl(internalPath), true)
  assert.equal(isSafeMarkdownHref(internalPath), true)
  assert.equal(isDeployPath(internalPath), true)
  assert.equal(new URL(internalPath, appboxUrl).origin, appboxUrl.origin)

  assert.equal(isSafeLinkUrl("https://docs.appbox.co"), true)
  assert.equal(isSafeMarkdownHref("#installation"), true)
  assert.equal(isSafeMarkdownHref("mailto:security@appbox.co"), true)
  assert.equal(isSafeMarkdownHref("tel:+441234567890"), true)
} finally {
  await rm(outputDir, { force: true, recursive: true })
}
