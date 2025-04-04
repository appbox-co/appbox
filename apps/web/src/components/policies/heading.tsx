import type { Policy } from "contentlayer/generated"
import Balancer from "react-wrap-balancer"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"

interface PolicyHeadingProps {
  policy: Policy & { notAvailable: boolean }
  locale: LocaleOptions
}

export function PolicyHeading({ policy }: PolicyHeadingProps) {
  return (
    <div className="space-y-2">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
        {policy.title}
      </h1>

      {policy.description && (
        <p className="text-muted-foreground text-lg">
          <Balancer>{policy.description}</Balancer>
        </p>
      )}

      {policy.notAvailable && (
        <div className="text-muted-foreground mb-4 rounded-md bg-secondary p-4">
          <p>This policy is not available in your selected language.</p>
        </div>
      )}
    </div>
  )
}
