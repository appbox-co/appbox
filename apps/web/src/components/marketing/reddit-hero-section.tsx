import type { AppDetails } from "@/api/appbox/hooks/use-app-details"
import { HeroInstallPreview } from "@/components/marketing/hero-install-preview"
import { LiveInstallCounter } from "@/components/marketing/live-install-counter"
import { buttonVariants } from "@/components/ui/button"
import { FlipWords } from "@/components/ui/flip-words"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

interface RedditHeroSectionProps {
  app: AppDetails | null
  headingPrefix: string
  headingEmphasis: string
  subheadingPrefix: string
  flipwords: string[]
  subheadingSuffix: string
  description: string
  primaryCta: string
  secondaryCta: string
}

export function RedditHeroSection({
  app,
  headingPrefix,
  headingEmphasis,
  subheadingPrefix,
  flipwords,
  subheadingSuffix,
  description,
  primaryCta,
  secondaryCta
}: RedditHeroSectionProps) {
  return (
    <div className="relative overflow-hidden py-10 md:py-14 lg:py-18">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-[4rem] bg-linear-to-br from-indigo-500/15 via-sky-500/8 to-purple-500/12 blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10 dark:to-purple-500/15 md:block" />

      <section className="grid min-h-[560px] items-start gap-10 min-[1036px]:grid-cols-2 min-[1036px]:gap-14 md:min-h-[620px]">
        <div className="flex max-w-3xl flex-col items-start text-left">
          <h1
            className="max-w-[760px] text-balance text-left text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl xl:text-8xl [&_span]:mr-[-0.08em] [&_span]:inline-block [&_span]:bg-linear-to-r [&_span]:from-indigo-500 [&_span]:to-purple-500 [&_span]:bg-size-[calc(100%+0.16em)_100%] [&_span]:bg-clip-text [&_span]:pr-[0.08em] [&_span]:text-transparent"
            style={{
              fontFamily:
                'Inter, var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
          >
            {headingPrefix} <span>{headingEmphasis}</span>
          </h1>

          <div className="mt-5 text-left text-2xl font-normal tracking-tight text-muted-foreground sm:text-3xl md:text-4xl">
            {subheadingPrefix}
            <FlipWords
              words={flipwords}
              className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl md:text-4xl"
            />
            {subheadingSuffix}
          </div>

          <LiveInstallCounter className="justify-start py-4" />

          <p className="max-w-2xl text-left text-lg text-muted-foreground sm:text-xl">
            {description}
          </p>

          <div className="flex w-full flex-col items-stretch gap-3 py-6 sm:w-auto sm:flex-row sm:items-center">
            <Link href="#plans-section" className={cn(buttonVariants({ size: "lg" }))}>
              {primaryCta}
            </Link>

            <Link
              href="/apps"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              {secondaryCta}
            </Link>
          </div>
        </div>

        <HeroInstallPreview app={app} />
      </section>

      <div className="mt-8 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
    </div>
  )
}
