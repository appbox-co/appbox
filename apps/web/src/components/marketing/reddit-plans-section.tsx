import type { ComponentProps } from "react"
import type { PlansData } from "@/components/ui/plans"
import Plans from "@/components/ui/plans"

interface RedditPlansSectionProps {
  plansData: PlansData
  eyebrow: string
  heading: string
  description: string
  messages: ComponentProps<typeof Plans>["messages"]
}

export function RedditPlansSection({
  plansData,
  eyebrow,
  heading,
  description,
  messages
}: RedditPlansSectionProps) {
  return (
    <section id="plans-section" className="scroll-mt-4 pt-4">
      <div className="mb-2 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </div>

      <Plans data={plansData.data} messages={messages} />
    </section>
  )
}
