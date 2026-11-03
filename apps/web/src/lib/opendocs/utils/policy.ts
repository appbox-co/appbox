import { getAllPolicies } from "@/lib/content"
import { routing } from "@/i18n/routing"
import { LocaleOptions } from "../types/i18n"

interface GetPolicyFromParamsProps {
  params: {
    slug?: string[]
    locale: LocaleOptions
  }
}

export async function getPolicyFromParams({
  params
}: GetPolicyFromParamsProps) {
  const slug = params.slug?.join("/") || ""
  const locale = params.locale

  const slugWithLocale = locale ? `${locale}/${slug}` : slug

  let policy = getAllPolicies().find(
    (policy) => policy.slugAsParams === slugWithLocale
  )

  if (!policy) {
    const defaultSlugWithLocale = [routing.defaultLocale, slug]
      .filter(Boolean)
      .join("/")

    policy = getAllPolicies().find(
      (policy) => policy.slugAsParams === defaultSlugWithLocale
    )
  }

  return policy || null
}
