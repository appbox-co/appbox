import type { InstalledAppVncInfo } from "@/api/installed-apps/installed-apps"
import type { SampleHandler } from "./types"

/**
 * Sample answer for the VM console's one request: the VNC details of an
 * instance, asked of the Appbox server it runs on.
 *
 * A sample page must not open a connection to a real host, and a console is
 * nothing but a connection. So the answer names no WebSocket port: with no
 * port there is no address to connect to, and `AppConsole` shows its "Console
 * WebSocket endpoint is not available for this VM" notice instead of a screen.
 * It never loads noVNC and never opens a socket.
 */
export const consoleSamples: SampleHandler = ({ target, method, path }) => {
  if (target !== "server" || method.toUpperCase() !== "GET") return undefined

  const match = path.match(/^app\/instances\/(\d+)\/vnc$/)
  if (!match) return undefined

  const instanceId = Number(match[1])
  const info: InstalledAppVncInfo = {
    vnc_port: null,
    websocket_port: null,
    password: "",
    instance_id: instanceId,
    vm_name: `vm-${instanceId}`
  }
  return info
}
