import { Fragment } from "react"
import type { Doc } from "contentlayer/generated"
import { ChevronRightIcon } from "lucide-react"
import { Link, routing } from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import { getBreadcrumb } from "@/lib/opendocs/utils/doc"
import { getObjectValueByLocale } from "@/lib/opendocs/utils/locale"

interface DocBreadcrumbProps {
  doc: Doc

  messages: {
    docs: string
  }
}

export function DocBreadcrumb({ doc, messages }: DocBreadcrumbProps) {
  const [locale] = (doc.slugAsParams.split("/") || routing.defaultLocale) as [
    LocaleOptions
  ]

  const breadcrumbItems = getBreadcrumb(doc.slug)

  return (
    <div className="text-muted-foreground mb-4 flex items-center space-x-1 text-sm">
      <Link href="/docs" className="text-foreground hover:underline">
        {messages.docs}
      </Link>

      {breadcrumbItems?.map((item, index, items) => {
        const isLastItem = index === items.length - 1
        const docTitle = getObjectValueByLocale(item.title, locale)

        return (
          <Fragment key={index}>
            <ChevronRightIcon className="size-4" />

            {item.href && !isLastItem ? (
              <Link
                href={item.href}
                className="text-foreground truncate font-medium hover:underline"
              >
                {docTitle}
              </Link>
            ) : (
              <span className="truncate">{docTitle}</span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
