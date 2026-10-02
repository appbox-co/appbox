import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"

const outputDir = await mkdtemp(join(tmpdir(), "app-version-boost-"))
try {
  const outputFile = join(outputDir, "test.mjs")
  await build({
    stdin: {
      contents: `
        export { getEffectiveAppSlots, getAppBoostInfo } from "./src/api/apps/app-store";
        export { useAppBoostInfo } from "./src/api/apps/hooks/use-app-store";
        export { queryKeys } from "./src/constants/query-keys";
      `,
      resolveDir: new URL("..", import.meta.url).pathname,
      loader: "ts"
    },
    outfile: outputFile,
    bundle: true,
    platform: "node",
    format: "esm",
    tsconfig: new URL("../tsconfig.json", import.meta.url).pathname,
    plugins: [
      {
        name: "query-fixtures",
        setup(builder) {
          const mocks = {
            "@/api/client": `
            export async function apiGet(path, options) { return { path, options }; }
            export const apiPost = apiGet, apiPut = apiGet, apiDelete = apiGet, serverApiGet = apiGet;
          `,
            "@/providers/auth-provider": `export const useAuth = () => ({ isAdmin: false });`,
            "@tanstack/react-query": `
            export const useQuery = (options) => options;
            export const useMutation = (options) => options;
            export const useQueryClient = () => ({});
          `
          }
          builder.onResolve(
            {
              filter:
                /^(?:@\/api\/client|@\/providers\/auth-provider|@tanstack\/react-query)$/
            },
            (args) => ({ path: args.path, namespace: "fixture" })
          )
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents: mocks[args.path],
            loader: "js"
          }))
        }
      }
    ]
  })
  const {
    getEffectiveAppSlots,
    getAppBoostInfo,
    useAppBoostInfo: getBoostQueryOptions,
    queryKeys
  } = await import(pathToFileURL(outputFile))
  const app = { app_slots: 1, default_version: { app_slots: 1 } }
  const minimal = { app_slots: 1 }
  const desktop = { app_slots: 5 }

  assert.equal(getEffectiveAppSlots(app, minimal), 1)
  assert.equal(getEffectiveAppSlots(app, desktop), 5)
  assert.equal(
    3 >= getEffectiveAppSlots(app, desktop),
    false,
    "Three free slots cannot install Desktop"
  )
  assert.equal(
    3 >= getEffectiveAppSlots(app, minimal),
    true,
    "Switching back to Minimal restores availability"
  )
  assert.equal(getEffectiveAppSlots(app), 1)
  assert.equal(getEffectiveAppSlots({ app_slots: 3 }), 3)
  assert.equal(getEffectiveAppSlots(app, { app_slots: 0 }), 0)
  assert.equal(getEffectiveAppSlots(app, { app_slots: null }), 1)
  assert.equal(
    getEffectiveAppSlots({ app_slots: 5, default_version: desktop }, minimal),
    1
  )

  const minimalQuery = getBoostQueryOptions(281, 11350, 1357)
  const desktopQuery = getBoostQueryOptions(281, 11350, 1358)
  assert.notDeepEqual(
    minimalQuery.queryKey,
    desktopQuery.queryKey,
    "Version switching must fetch a distinct Boost budget"
  )
  assert.deepEqual(
    minimalQuery.queryKey,
    queryKeys.apps.boostInfo(281, 11350, 1357)
  )
  assert.deepEqual(
    desktopQuery.queryKey,
    queryKeys.apps.boostInfo(281, 11350, 1358)
  )
  assert.deepEqual((await minimalQuery.queryFn()).options.params, {
    cylo_id: "11350",
    version_id: "1357"
  })
  assert.deepEqual((await desktopQuery.queryFn()).options.params, {
    cylo_id: "11350",
    version_id: "1358"
  })
  assert.deepEqual((await getAppBoostInfo(281, 11350)).options.params, {
    cylo_id: "11350"
  })
  assert.equal(getBoostQueryOptions(281, 0, 1358).enabled, false)
  console.log(
    "Version-specific slot availability, Boost requests and cache switching passed"
  )
} finally {
  await rm(outputDir, { recursive: true, force: true })
}
