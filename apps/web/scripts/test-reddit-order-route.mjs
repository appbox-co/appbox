import assert from "node:assert/strict"
import { mkdir, rm } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = new URL("../.tmp-tests/", import.meta.url)
const outputFile = new URL("./reddit-order-route.mjs", outputDir)

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

await build({
  entryPoints: [
    new URL("../src/lib/reddit-order-url.ts", import.meta.url).pathname
  ],
  outfile: outputFile.pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node23",
  tsconfig: new URL("../tsconfig.json", import.meta.url).pathname,
  external: ["next/server", "next/headers", "server-only"]
})

const { buildRedditOrderBillingUrl } = await import(
  pathToFileURL(outputFile.pathname)
)

try {
  const nonConsentedLocation = buildRedditOrderBillingUrl(
    new URLSearchParams(
      "pid=83&billingcycle=monthly&promocode=WELCOME&utm_source=reddit&utm_medium=paid_social&utm_campaign=test&utm_content=test&rdt_cid=TEST123"
    )
  ).billingUrl

  assert.equal(nonConsentedLocation.host, "billing.appbox.co")
  assert.equal(nonConsentedLocation.searchParams.get("pid"), "83")
  assert.equal(nonConsentedLocation.searchParams.get("billingcycle"), "monthly")
  assert.equal(nonConsentedLocation.searchParams.get("promocode"), "WELCOME")
  assert.equal(nonConsentedLocation.searchParams.get("utm_source"), "reddit")
  assert.equal(nonConsentedLocation.searchParams.get("utm_campaign"), "test")
  assert.equal(nonConsentedLocation.searchParams.get("rdt_cid"), null)
  assert.equal(nonConsentedLocation.searchParams.get("rdt_cid_present"), "1")
  assert.equal(nonConsentedLocation.searchParams.get("landing_id"), null)
  assert.equal(
    nonConsentedLocation.searchParams.get("appbox_tracking_consent"),
    null
  )

  const spoofedConsentLocation = buildRedditOrderBillingUrl(
    new URLSearchParams(
      "pid=83&billingcycle=annually&utm_source=reddit&rdt_cid=TEST123&landing_id=landing-123&appbox_tracking_consent=1&appbox_consent_token=fake-token"
    )
  ).billingUrl

  assert.equal(
    spoofedConsentLocation.searchParams.get("billingcycle"),
    "annually"
  )
  assert.equal(spoofedConsentLocation.searchParams.get("utm_source"), "reddit")
  assert.equal(spoofedConsentLocation.searchParams.get("rdt_cid"), null)
  assert.equal(spoofedConsentLocation.searchParams.get("rdt_cid_present"), "1")
  assert.equal(
    spoofedConsentLocation.searchParams.get("landing_id"),
    "landing-123"
  )
  assert.equal(
    spoofedConsentLocation.searchParams.get("appbox_tracking_consent"),
    null
  )
  assert.equal(
    spoofedConsentLocation.searchParams.get("appbox_consent_token"),
    null
  )

  const landingIdResult = buildRedditOrderBillingUrl(
    new URLSearchParams("pid=83&landing_id=landing-123&utm_source=reddit")
  )

  assert.equal(landingIdResult.landingId, "landing-123")
  assert.equal(
    landingIdResult.billingUrl.searchParams.get("landing_id"),
    "landing-123"
  )

  assert.equal(buildRedditOrderBillingUrl(new URLSearchParams("pid=bad")), null)
} finally {
  await rm(outputDir, { force: true, recursive: true })
}
