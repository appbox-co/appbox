import { cookies } from "next/headers"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"

export interface User {
  id: number
  email: string
  firstname: string
  lastname: string
  alias: string | null
  avatar: string | null
  roles: string
  two_factor_enabled: boolean
  brand_id: number
  currency_code: string
  created_at: string
}

export interface Cylo {
  id: number
  user_id: number
  server_id: number
  server_name: string
  display_name: string
  package_id: number
  package_name: string
  domain: string
  domain_id: number
  server_ip: string
  status: string
  disk_quota: number
  disk_used: number
  app_slots: number
  app_slots_used: number
  resource_multiplier: number
  whmcs_serviceid: string
  created_at: string
}

export interface SessionData {
  user: User
  cylos: Cylo[]
  token: string
}

export async function validateSession(
  token: string
): Promise<SessionData | null> {
  try {
    // Validate token and get user info
    const userResponse = await fetch(`${API_BASE_URL}/users/validate_token`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Appbox-Web/2.0",
        Cookie: `authorization_token=${token}`
      },
      cache: "no-store"
    })

    if (!userResponse.ok) {
      return null
    }

    const userData = await userResponse.json()

    // Backend returns `false` if the token is invalid
    if (!userData || userData === false || !userData.id) {
      return null
    }

    // Fetch user's cylos (pass user_id so admins only get their own)
    let cylos: Cylo[] = []
    try {
      const cylosResponse = await fetch(
        `${API_BASE_URL}/cylos?user_id=${userData.id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Appbox-Web/2.0",
            Cookie: `authorization_token=${token}`
          },
          cache: "no-store"
        }
      )

      if (cylosResponse.ok) {
        const cylosData = await cylosResponse.json()

        cylos = (cylosData.items || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          user_id: c.user_id,
          server_id: c.server_id,
          server_name: c.server_name ?? "",
          display_name: c.cyloname ?? "",
          package_id: c.package_id ?? 0,
          package_name: c.package_name ?? "",
          domain: c.domain ?? "",
          domain_id: c.domain_id ?? 0,
          server_ip: c.server_ip ?? "",
          status: c.state ?? "unknown",
          disk_quota: c.storage_limit ?? 0,
          disk_used: 0,
          app_slots: Number(c.app_slots ?? 0),
          app_slots_used:
            Number(c.app_slots ?? 0) - Number(c.free_slots ?? 0),
          resource_multiplier: Number(
            c.resource_multiplier_current ?? c.resource_multiplier ?? 1
          ),
          whmcs_serviceid: c.whmcs_serviceid ?? "",
          created_at: c.created_at ?? ""
        }))
      }
    } catch {
      // Non-fatal: proceed without cylos
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        alias: userData.alias,
        avatar: userData.avatar,
        roles: userData.roles,
        two_factor_enabled: !!userData.totp_enabled,
        brand_id: userData.brand_id,
        currency_code: userData.currency_code,
        created_at: userData.created_at
      },
      cylos,
      token
    }
  } catch {
    return null
  }
}

export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("authorization_token")?.value

  if (!token) {
    return null
  }

  return validateSession(token)
}
