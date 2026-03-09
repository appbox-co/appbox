import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PinnedApp {
  id: number
  app_instance_id: number
  cylo_id: number
  display_name: string
  icon_image: string
  sort_order: number
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getPinnedApps(cyloId: number): Promise<PinnedApp[]> {
  return apiGet<PinnedApp[]>("pinnedapps", {
    params: { cylo_id: String(cyloId) }
  })
}

export async function pinApp(data: {
  app_instance_id: number
  cylo_id: number
}): Promise<PinnedApp> {
  return apiPost<PinnedApp>("pinnedapps", data)
}

export async function unpinApp(appInstanceId: number): Promise<void> {
  return apiDelete(`pinnedapps/${appInstanceId}`)
}

export async function reorderPinnedApps(
  cyloId: number,
  order: number[]
): Promise<void> {
  return apiPut("pinnedapps/reorder", { cylo_id: cyloId, order })
}
