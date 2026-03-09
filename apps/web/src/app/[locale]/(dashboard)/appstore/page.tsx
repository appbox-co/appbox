"use client"

import { useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Search,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon
} from "lucide-react"
import {
  useAppCategories,
  useFeaturedApps,
  useNewApps,
  useTopApps
} from "@/api/apps/hooks/use-app-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { AppStoreCard } from "./_components/app-store-card"
import { FeaturedAppCard } from "./_components/featured-app-card"

/* -------------------------------------------------------------------------- */
/*  Skeleton helpers                                                           */
/* -------------------------------------------------------------------------- */

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="size-14 shrink-0 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-xl border bg-linear-to-br from-muted/50 to-muted/20 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="size-16 shrink-0 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section component                                                          */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  showAllHref,
  showAllLabel
}: {
  title: string
  description?: string
  icon: LucideIcon
  gradientFrom: string
  gradientTo: string
  showAllHref?: string
  showAllLabel?: string
}) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-[10px] text-white shadow-sm bg-linear-to-br",
            gradientFrom,
            gradientTo
          )}
        >
          <Icon className="size-[18px]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {showAllHref && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-primary hover:text-primary/80"
          onClick={() => router.push(showAllHref)}
        >
          {showAllLabel ?? "Show All"}
          <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  AppStorePage                                                                */
/* -------------------------------------------------------------------------- */

export default function AppStorePage() {
  const t = useTranslations("appstore")
  const router = useRouter()

  const { data: featuredApps, isLoading: featuredLoading } = useFeaturedApps()
  const { data: topApps, isLoading: topLoading } = useTopApps()
  const { data: newApps, isLoading: newLoading } = useNewApps()
  const { data: categories } = useAppCategories()

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value.trim()
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (!q) return
      searchTimerRef.current = setTimeout(() => {
        router.push(`${ROUTES.APP_STORE_SEARCH}?q=${encodeURIComponent(q)}`)
      }, 350)
    },
    [router]
  )

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      const formData = new FormData(e.currentTarget)
      const q = (formData.get("q") as string)?.trim()
      if (q) {
        router.push(`${ROUTES.APP_STORE_SEARCH}?q=${encodeURIComponent(q)}`)
      }
    },
    [router]
  )

  const handleCategoryClick = useCallback(
    (categoryId: number) => {
      router.push(`${ROUTES.APP_STORE_SEARCH}?category=${categoryId}`)
    },
    [router]
  )

  return (
    <div className="space-y-8">
      {/* Hero / Search */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#6366f1] to-[#0091FF] p-8 text-white">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-white/80">{t("subtitle")}</p>

          <form
            onSubmit={handleSearchSubmit}
            className="relative mt-4 max-w-lg"
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <Input
              name="q"
              placeholder={t("search.placeholder")}
              className="h-10 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/50 backdrop-blur-sm focus-visible:ring-white/30"
              autoFocus
              autoComplete="off"
              onChange={handleSearchInput}
            />
          </form>
        </div>
      </div>

      {/* Categories chips */}
      {categories && categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("categories.title")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(ROUTES.APP_STORE_SEARCH)}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "bg-primary text-primary-foreground border-primary"
              )}
            >
              {t("categories.all")}
            </button>
            {categories
              .filter((c) => c.id !== 16)
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                    "text-muted-foreground"
                  )}
                >
                  {category.display_name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Featured Apps */}
      <section className="space-y-4">
        <SectionHeader
          title={t("featured.title")}
          description={t("featured.description")}
          icon={Star}
          gradientFrom="from-[#f59e0b]"
          gradientTo="to-[#d97706]"
        />
        {featuredLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <FeaturedSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredApps?.slice(0, 3).map((app, index) => (
              <FeaturedAppCard key={app.id} app={app} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* New Apps */}
      <section className="space-y-4">
        <SectionHeader
          title={t("new.title")}
          description={t("new.description")}
          icon={Zap}
          gradientFrom="from-[#10b981]"
          gradientTo="to-[#059669]"
          showAllHref={`${ROUTES.APP_STORE_SEARCH}?sort=newest`}
          showAllLabel={t("showAll")}
        />
        {newLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newApps?.map((app) => (
              <AppStoreCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* Top Apps */}
      <section className="space-y-4">
        <SectionHeader
          title={t("top.title")}
          description={t("top.description")}
          icon={TrendingUp}
          gradientFrom="from-[#6366f1]"
          gradientTo="to-[#8b5cf6]"
          showAllHref={`${ROUTES.APP_STORE_SEARCH}?sort=rating`}
          showAllLabel={t("showAll")}
        />
        {topLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topApps?.map((app) => (
              <AppStoreCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
