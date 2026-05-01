import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { FAQAccordion } from "@/components/marketing/faq-accordion"

const questions = [
  "payment_methods",
  "deployment_time",
  "server_location",
  "root_access",
  "docker",
  "security",
  "data_access",
  "additional_software",
  "fuse_rclone",
  "refund_policy",
  "custom_domain",
  "upgrade_after_purchase",
  "app_slots",
  "resource_multipliers",
  "app_freeze",
  "excluded_app_categories",
  "vps"
]

const gatedQuestions: Record<string, string> = {
  resource_multipliers: "showResourceMultipliers",
  vps: "showVps"
}

export function FAQSection({
  title,
  description,
  id,
  showResourceMultipliers = true,
  showVps = true
}: {
  title: string
  description?: string
  id?: string
  showResourceMultipliers?: boolean
  showVps?: boolean
}) {
  const t = useTranslations("site.faq")
  const flags: Record<string, boolean> = {
    showResourceMultipliers,
    showVps
  }
  const visibleQuestions = questions.filter((q) => {
    const gate = gatedQuestions[q]
    return !gate || flags[gate]
  })
  const sectionId = id ?? "faq"

  return (
    <section id={sectionId} className="scroll-mt-16 py-16">
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html:
              ".js-only-faq{display:none!important}" +
              ".noscript-only-faq{display:block!important}"
          }}
        />
      </noscript>
      <div className="container">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground mt-4">{description}</p>
            )}
          </div>
          <div className="js-only-faq divide-border divide-y">
            <FAQAccordion questions={visibleQuestions} sectionId={sectionId} />
          </div>
          <div className="noscript-only-faq divide-border hidden divide-y">
            {visibleQuestions.map((question) => (
              <details
                key={question}
                id={`faq-${question}`}
                name={sectionId}
                data-faq-item
                className="border-border group border-b"
              >
                <summary className="flex cursor-pointer list-none items-start py-4 text-left font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                  <span className="relative mr-4 mt-1 size-6 shrink-0 transition-all">
                    <Plus
                      size={16}
                      strokeWidth={2}
                      className="size-6 shrink-0 rotate-0 text-blue-500 transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="flex w-full items-start">
                    <span className="text-foreground flex-1 text-lg font-medium">
                      {t(`questions.${question}.title`)}
                    </span>
                  </span>
                </summary>
                <div className="pb-4 pt-0 text-sm">
                  <div className="max-w-none text-sm/[1.125rem] text-neutral-500 md:text-base/[1.375rem] dark:text-neutral-400">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: t.raw(`questions.${question}.content`)
                      }}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
