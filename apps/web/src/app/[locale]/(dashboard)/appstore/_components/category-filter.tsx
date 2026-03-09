"use client"

import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { useAppCategories } from "@/api/apps/hooks/use-app-store"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  selected?: string
  onChange: (categoryId: string | undefined) => void
  className?: string
}

export function CategoryFilter({
  selected,
  onChange,
  className
}: CategoryFilterProps) {
  const t = useTranslations("appstore")
  const { data: categories, isLoading } = useAppCategories()

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading categories...
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Badge
        variant={!selected ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-colors",
          !selected ? "" : "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => onChange(undefined)}
      >
        {t("categories.all")}
      </Badge>
      {categories
        ?.filter((c) => c.id !== 16)
        .map((category) => (
          <Badge
            key={category.id}
            variant={selected === String(category.id) ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              selected === String(category.id)
                ? ""
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onChange(String(category.id))}
          >
            {category.display_name}
            {category.app_count > 0 && (
              <span className="ml-1 opacity-60">({category.app_count})</span>
            )}
          </Badge>
        ))}
    </div>
  )
}
