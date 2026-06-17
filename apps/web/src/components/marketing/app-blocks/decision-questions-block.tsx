import type { DecisionQuestionsBlock as DecisionQuestionsBlockType } from "@/types/marketing-blocks"

interface DecisionQuestionsBlockProps {
  block: DecisionQuestionsBlockType
}

export function DecisionQuestionsBlock({ block }: DecisionQuestionsBlockProps) {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-4xl">
        {(block.title || block.intro) && (
          <div className="mb-8 max-w-3xl">
            {block.title && (
              <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                {block.title}
              </h2>
            )}
            {block.intro && (
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {block.intro}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {block.items.map((item, index) => (
            <article
              key={`${item.question}-${index}`}
              className="rounded-2xl border border-border/70 bg-background/70 p-6 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {item.question}
                  </h3>
                  <p className="leading-7 text-muted-foreground">
                    {item.guidance}
                  </p>
                  {item.answer && (
                    <p className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm leading-6 text-foreground">
                      {item.answer}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
