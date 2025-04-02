import { setRequestLocale } from 'next-intl/server'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { LocaleOptions } from '@/lib/opendocs/types/i18n'

interface PoliciesLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: LocaleOptions
  }>
}

export const dynamicParams = true

export default async function PoliciesLayout(props: PoliciesLayoutProps) {
  const params = await props.params
  const { children } = props

  setRequestLocale(params.locale)

  return (
    <div className="border-b">
      <div className="container flex-1 items-start md:grid md:grid-cols-[minmax(0,1fr)] md:gap-6 lg:gap-10">
        {children}
      </div>
    </div>
  )
}
