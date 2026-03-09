import { cookies } from "next/headers"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"

export async function serverGet<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get("authorization_token")?.value

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...(token ? { Cookie: `authorization_token=${token}` } : {}),
      ...options.headers
    }
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function serverGetFromServer<T>(
  serverName: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get("authorization_token")?.value
  const baseUrl = `https://${serverName}.${DOMAIN}/v1`

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...(token ? { Cookie: `authorization_token=${token}` } : {}),
      ...options.headers
    }
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
