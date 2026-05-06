import { apiGet, apiPut } from "@/api/client"

export interface BlogKudos {
  slug: string
  count: number
  hasKudoed: boolean
}

export async function getBlogKudos(
  slug: string,
  token?: string
): Promise<BlogKudos> {
  const params: Record<string, string> = { slug }

  if (token) {
    params.token = token
  }

  return apiGet<BlogKudos>("blog/kudos", { params })
}

export async function createBlogKudo(
  slug: string,
  token: string
): Promise<BlogKudos> {
  return apiPut<BlogKudos>("blog/kudos", { slug, token })
}
