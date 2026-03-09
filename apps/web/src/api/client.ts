const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.appbox.co/v1"
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "appbox.co"

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error")
    throw new ApiError(response.status, response.statusText, errorBody)
  }
  // 204 No Content or empty body — return undefined rather than crashing on JSON.parse
  const contentLength = response.headers.get("content-length")
  const contentType = response.headers.get("content-type") ?? ""
  if (
    response.status === 204 ||
    contentLength === "0" ||
    !contentType.includes("application/json")
  ) {
    return undefined as T
  }
  return response.json()
}

export async function apiGet<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${API_BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    }
  })
  return handleResponse<T>(response)
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${API_BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "POST",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${API_BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "PUT",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${API_BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "DELETE",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    }
  })
  return handleResponse<T>(response)
}

/**
 * Resolve the base URL for a server-specific API endpoint.
 *
 * File explorer endpoints (starting with "files/") are served by a dedicated
 * fileexplorer subdomain. All other server API calls go to the server subdomain.
 */
function getServerDirectUrl(serverName: string, endpoint: string): string {
  const isFileExplorer = endpoint.startsWith("files/")
  const host = isFileExplorer
    ? `fileexplorer.${serverName}.${DOMAIN}`
    : `${serverName}.${DOMAIN}`
  return `https://${host}/v1`
}

export async function serverApiGet<T>(
  serverName: string,
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${getServerDirectUrl(serverName, endpoint)}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    }
  })
  return handleResponse<T>(response)
}

export async function serverApiPost<T>(
  serverName: string,
  endpoint: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${getServerDirectUrl(serverName, endpoint)}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "POST",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

export async function serverApiDelete<T>(
  serverName: string,
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${getServerDirectUrl(serverName, endpoint)}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "DELETE",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    }
  })
  return handleResponse<T>(response)
}

export async function serverApiPatch<T>(
  serverName: string,
  endpoint: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${getServerDirectUrl(serverName, endpoint)}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "PATCH",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

/**
 * Upload files via multipart/form-data to a server-specific endpoint.
 * Does NOT set Content-Type so the browser auto-generates the boundary.
 */
export async function serverApiUpload<T>(
  serverName: string,
  endpoint: string,
  formData: FormData,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = new URL(`${getServerDirectUrl(serverName, endpoint)}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )
  }
  const response = await fetch(url.toString(), {
    method: "POST",
    ...fetchOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "User-Agent": "Appbox-Web/2.0",
      ...fetchOptions.headers
    },
    body: formData
  })
  return handleResponse<T>(response)
}

export { ApiError }
