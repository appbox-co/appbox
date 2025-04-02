import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import type { Policy } from 'contentlayer/generated'

import { routing, Link } from '@/i18n/routing'

interface PolicyBreadcrumbProps {
  policy: Policy
  locale: LocaleOptions
}

export function PolicyBreadcrumb({ policy, locale }: PolicyBreadcrumbProps) {
  return (
    <div className="text-muted-foreground mb-4 flex items-center space-x-1 text-sm">
      <Link href={`/${locale}/policies`} className="hover:underline">
        Policies
      </Link>

      <ChevronRightIcon className="size-4" />

      <span className="truncate text-foreground font-medium">
        {policy.title}
      </span>
    </div>
  )
}
