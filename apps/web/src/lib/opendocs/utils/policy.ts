import { allPolicies } from 'contentlayer/generated'
import { LocaleOptions } from '../types/i18n'

interface GetPolicyFromParamsProps {
  params: {
    slug?: string[]
    locale: LocaleOptions
  }
}

export async function getPolicyFromParams({
  params,
}: GetPolicyFromParamsProps) {
  const slug = params.slug?.join('/') || ''
  const locale = params.locale

  const slugWithLocale = locale ? `${locale}/${slug}` : slug

  const policy = allPolicies.find(
    (policy) => policy.slugAsParams === slugWithLocale
  )

  if (!policy) {
    return null
  }

  return policy
}
