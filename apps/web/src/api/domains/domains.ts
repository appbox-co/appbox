import { apiDelete, apiGet, apiPut } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface Domain {
  id: number
  domain: string
  fqdn: string | null
  type: string | null // "domain" (base) | "subdomain"
  parent: number | null // parent domain id for subdomains
  parent_domain: string | null
  instance_id: number | null
  cylo_id: number | null // resolved from appinstance join
  app: string | null // installed app display name
  ip_address: string | null
  created_at: string
}

export interface InstanceDomain {
  id: number
  domain: string
  fqdn: string | null
  parent: number | null
  domain_id: number | null
  is_initial?: number | boolean
  created_at: string
}

export interface AddInstanceDomainPayload {
  subdomain: string
  domain_id: number
  cylo_id: number
}

export interface ConfigSnippetItem {
  file?: string
  config?: string
  enable_command?: string
  reload_command?: string
  notes?: string
}

export interface InstanceDomainConfigResponse {
  domain: string
  is_custom_domain?: boolean
  config_snippets?: {
    nginx?: ConfigSnippetItem
    apache?: ConfigSnippetItem
  }
}

/* -------------------------------------------------------------------------- */
/*  API functions                                                              */
/* -------------------------------------------------------------------------- */

export async function getDomains(userId?: number): Promise<Domain[]> {
  const params = new URLSearchParams({ limit: "999" })
  if (userId) params.set("user_id", String(userId))
  const res = await apiGet<{ items: Domain[] } | Domain[]>(
    `domains?${params.toString()}`
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function deleteDomain(id: number): Promise<void> {
  return apiDelete(`domains/${id}`)
}

export async function getInstanceDomains(
  instanceId: number
): Promise<InstanceDomain[]> {
  const res = await apiGet<{ items: InstanceDomain[] } | InstanceDomain[]>(
    `domains/instance/${instanceId}`
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function addInstanceDomain(
  instanceId: number,
  payload: AddInstanceDomainPayload
): Promise<InstanceDomain & InstanceDomainConfigResponse> {
  return apiPut<InstanceDomain & InstanceDomainConfigResponse>(
    `domains/instance/${instanceId}`,
    payload
  )
}

export async function getInstanceDomainConfig(
  instanceId: number,
  domain: string
): Promise<InstanceDomainConfigResponse> {
  return apiGet<InstanceDomainConfigResponse>(
    `domains/instance/${instanceId}/${encodeURIComponent(domain)}/config`
  )
}

export async function deleteInstanceDomain(
  instanceId: number,
  domainId: number
): Promise<void> {
  return apiDelete(`domains/instance/${instanceId}/${domainId}`)
}
