import { apiDelete, apiGet, apiPost } from "@/api/client"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** How the client registered: a Client ID Metadata Document, DCR, or Appbox's own. */
export type OAuthClientKind = "cimd" | "dcr" | "first_party"

/** A pending authorization request, as the consent page shows it. */
export interface OAuthConsentRequest {
  id: string
  client: {
    client_id: string
    /** Comes from the client itself, so it is never verified. */
    name: string
    kind: OAuthClientKind
    verified: boolean
    /** Host the browser returns to, or `scheme:` for a custom URL scheme. */
    redirect_host: string
    /** Every registered redirect URI is on localhost or a loopback address. */
    loopback_only: boolean
  }
  resource: string
  scopes: string[]
  /** False when this account can't connect apps yet (the pre-launch gate). */
  eligible: boolean
  ineligible_reason: string | null
  /** Unix seconds. */
  expires_at: number
}

export interface OAuthDecisionInput {
  approve: boolean
  /** The scopes the user approved. Leave out to keep the requested ones. */
  scopes?: string[]
}

export interface OAuthDecisionResult {
  /** The client's redirect URI with `code` (or `error`), `state` and `iss`. */
  redirect_to: string
}

/** An app the user has connected (an OAuth grant). */
export interface OAuthGrant {
  id: number
  client_id: string
  client_name: string
  client_kind: OAuthClientKind
  resource: string
  scopes: string[]
  created_at: string
  updated_at: string
  last_used_at: string | null
}

/* -------------------------------------------------------------------------- */
/*  Consent                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Backend: GET /v1/oauth/requests/{id} (session auth)
 *
 * The consent page calls this directly rather than through React Query: the
 * query client's 401 handler sends people to /login without a redirect,
 * which would lose the request.
 */
export async function getOAuthConsentRequest(
  id: string
): Promise<OAuthConsentRequest> {
  const res = await apiGet<OAuthConsentRequest>(
    `oauth/requests/${encodeURIComponent(id)}`
  )
  return {
    ...res,
    scopes: Array.isArray(res?.scopes) ? res.scopes : []
  }
}

/**
 * Backend: POST /v1/oauth/requests/{id}/decision (session auth; approving
 * needs a recent sign-in)
 */
export async function decideOAuthConsentRequest(
  id: string,
  data: OAuthDecisionInput
): Promise<OAuthDecisionResult> {
  return apiPost<OAuthDecisionResult>(
    `oauth/requests/${encodeURIComponent(id)}/decision`,
    data
  )
}

/* -------------------------------------------------------------------------- */
/*  Connected apps                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Backend: GET /v1/users/oauth/grants (session auth)
 */
export async function getOAuthGrants(): Promise<OAuthGrant[]> {
  const res = await apiGet<OAuthGrant[] | { items: OAuthGrant[] }>(
    "users/oauth/grants"
  )
  const items = Array.isArray(res) ? res : (res?.items ?? [])
  return items.map((item) => ({
    ...item,
    scopes: Array.isArray(item.scopes) ? item.scopes : []
  }))
}

/**
 * Backend: DELETE /v1/users/oauth/grants/{id} (session auth)
 */
export async function revokeOAuthGrant(
  id: number
): Promise<{ id: number; revoked: boolean }> {
  return apiDelete<{ id: number; revoked: boolean }>(`users/oauth/grants/${id}`)
}
