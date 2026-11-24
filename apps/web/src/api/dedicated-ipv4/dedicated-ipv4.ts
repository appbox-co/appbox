import { apiGet, apiPost } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** One of the signed-in customer's dedicated IPv4 addresses. */
export interface DedicatedIpv4Address {
  id: number
  address: string
  /** The Appbox it is assigned to, or null when unassigned. */
  cylo_id: number | null
  /** Outbound connections from the Appbox leave from its primary address. */
  is_primary: boolean
  whmcs_addon_id: number | null
  /**
   * Unassigned, but its old server has not confirmed the removal yet. It can
   * be assigned again once that happens, within minutes.
   */
  removal_pending: boolean
  assigned_at: string | null
}

/**
 * A change answers with the address as it is now. `applied` is false when
 * the server could not be told at once; it picks the change up within five
 * minutes.
 */
export interface DedicatedIpv4Change extends DedicatedIpv4Address {
  applied?: boolean
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getMyDedicatedIpv4(): Promise<DedicatedIpv4Address[]> {
  const res = await apiGet<{ addresses?: DedicatedIpv4Address[] }>(
    "dedicated-ipv4/mine"
  )
  return res?.addresses ?? []
}

export async function assignDedicatedIpv4(
  id: number,
  cyloId: number,
  primary = false
): Promise<DedicatedIpv4Change> {
  return apiPost<DedicatedIpv4Change>(`dedicated-ipv4/mine/${id}/assign`, {
    cylo_id: cyloId,
    primary
  })
}

export async function makeDedicatedIpv4Primary(
  id: number
): Promise<DedicatedIpv4Change> {
  return apiPost<DedicatedIpv4Change>(`dedicated-ipv4/mine/${id}/primary`)
}

export async function unassignDedicatedIpv4(
  id: number
): Promise<DedicatedIpv4Change> {
  return apiPost<DedicatedIpv4Change>(`dedicated-ipv4/mine/${id}/unassign`)
}
