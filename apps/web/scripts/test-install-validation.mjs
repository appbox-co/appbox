import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const folder = await mkdtemp(path.join(tmpdir(), "install-validation-test-"))
try {
  const outfile = path.join(folder, "validation.mjs")
  await build({
    entryPoints: [
      new URL("../src/lib/install-validation.ts", import.meta.url).pathname
    ],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22"
  })
  const {
    validateInstallField,
    getInstallFieldActivity,
    validInstallSubdomain,
    createInstallValidationSession
  } = await import(pathToFileURL(outfile))
  const fixtures = JSON.parse(
    await readFile(
      process.argv[2] ??
        new URL("./fixtures/install-validation.json", import.meta.url),
      "utf8"
    )
  )
  const normalize = (value) =>
    typeof value === "boolean"
      ? value
        ? "1"
        : "0"
      : value == null
        ? ""
        : String(value)
  const toField = (field) => {
    const validate = []
    if (field.required) validate.push("required")
    if (field.minLength || field.maxLength)
      validate.push({ minLength: field.minLength, maxLength: field.maxLength })
    const typeRule = {
      alphaNumeric: "alphanumeric",
      passwordAlphaNumeric: "alphanumeric",
      password: "notOnlyAlpha",
      complexPassword: "complexPassword",
      email: "email",
      date: "date"
    }[field.fieldtype]
    if (typeRule) validate.push(typeRule)
    if (field.regex)
      validate.push({
        name: "matches",
        execution: "server",
        params: { regex: field.regex }
      })
    return {
      type: field.fieldtype,
      label: field.fname,
      validate,
      defaultValue: field.default_value,
      condition: field.condition_json
    }
  }
  for (const test of [...fixtures.values, ...fixtures.conditions]) {
    const fields = Object.fromEntries(
      test.fields.map((field) => [field.fname, toField(field)])
    )
    let active = {},
      errors = {}
    try {
      active = getInstallFieldActivity(fields, test.values)
      for (const [name, field] of Object.entries(fields)) {
        if (!active[name]) continue
        const issue = validateInstallField(
          normalize(test.values[name] ?? field.defaultValue),
          field
        )
        if (issue) errors[name] = issue.code
      }
    } catch {
      errors._form = "configuration"
    }
    assert.deepEqual(errors, test.serverOnly ? {} : test.errors, test.name)
    if (test.active) assert.deepEqual(active, test.active, test.name)
  }
  for (const test of fixtures.subdomains)
    assert.equal(
      validInstallSubdomain(test.value.trim().toLowerCase()),
      test.result !== null,
      test.value
    )

  // Server-owned patterns are not interpreted by the browser, even when JS cannot parse them.
  assert.equal(
    validateInstallField("value", {
      validate: [
        {
          name: "matches",
          execution: "server",
          params: { regex: "/(?i)value/" }
        }
      ]
    }),
    null
  )

  const session = createInstallValidationSession()
  let resolveFirst
  const first = session.run(
    () =>
      new Promise((resolve) => {
        resolveFirst = resolve
      })
  )
  session.invalidate()
  resolveFirst({ valid: true })
  assert.equal(await first, null, "Changed forms invalidate earlier successes")

  let resolveOlder
  const older = session.run(
    () =>
      new Promise((resolve) => {
        resolveOlder = resolve
      })
  )
  assert.deepEqual(await session.run(async () => ({ valid: false })), {
    valid: false
  })
  resolveOlder({ valid: true })
  assert.equal(await older, null, "Newer requests supersede earlier results")
  await assert.rejects(
    session.run(async () => {
      throw new Error("offline")
    }),
    /offline/
  )

  let rejectStale
  const staleFailure = session.run(
    () =>
      new Promise((resolve, reject) => {
        rejectStale = reject
      })
  )
  session.invalidate()
  rejectStale(new Error("offline"))
  assert.equal(
    await staleFailure,
    null,
    "Stale failures do not replace current form feedback"
  )
  console.log(
    "Install validation passed:",
    fixtures.values.length,
    "value cases,",
    fixtures.conditions.length,
    "condition cases, subdomain and async checks."
  )
} finally {
  await rm(folder, { recursive: true, force: true })
}
