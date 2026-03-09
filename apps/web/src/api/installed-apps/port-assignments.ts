import { serverApiGet } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PortAssignment {
  id: number
  internal_ip: string | null
  host_ip: string | null
  internal_port: number
  host_port: number
  protocol: string | null
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getPortAssignments(
  serverName: string,
  instanceId: number
): Promise<PortAssignment[]> {
  const res = await serverApiGet<{ success: boolean; data: PortAssignment[] }>(
    serverName,
    `ports/${instanceId}`
  )
  return res.data ?? []
}
