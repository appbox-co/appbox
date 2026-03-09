/* global process, console */
import { existsSync, readFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { createServer as createHttpsServer } from "node:https"
import { dirname, isAbsolute, resolve } from "node:path"
import { fileURLToPath, parse } from "node:url"
import next from "next"

const appDir = dirname(fileURLToPath(import.meta.url))
const envLocalPath = resolve(appDir, ".env.local")

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) return
  const raw = readFileSync(envLocalPath, "utf8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function resolvePathFromAppDir(pathValue) {
  if (!pathValue) return pathValue
  return isAbsolute(pathValue) ? pathValue : resolve(appDir, pathValue)
}

loadEnvLocal()

const hostname =
  process.env.START_HOST || process.env.DEV_HTTPS_HOST || "localhost"
const port = Number(process.env.PORT || "3000")
const keyPath = resolvePathFromAppDir(
  process.env.START_HTTPS_KEY || process.env.DEV_HTTPS_KEY
)
const certPath = resolvePathFromAppDir(
  process.env.START_HTTPS_CERT || process.env.DEV_HTTPS_CERT
)
const hasHttpsKey = Boolean(keyPath)
const hasHttpsCert = Boolean(certPath)

if (hasHttpsKey !== hasHttpsCert) {
  throw new Error(
    "Both START_HTTPS_KEY and START_HTTPS_CERT must be set to enable HTTPS."
  )
}

const useHttps = hasHttpsKey && hasHttpsCert
const app = next({ dev: false, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const requestListener = (req, res) => {
    const parsedUrl = parse(req.url ?? "/", true)
    handle(req, res, parsedUrl)
  }

  const server = useHttps
    ? createHttpsServer(
        {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath)
        },
        requestListener
      )
    : createHttpServer(requestListener)

  server.listen(port, hostname, () => {
    const protocol = useHttps ? "https" : "http"
    console.log(`> Ready on ${protocol}://${hostname}:${port}`)
  })
})
