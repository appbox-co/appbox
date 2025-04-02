"use client"

import { AppGrid } from "@/components/app-grid"
import { AppSearch } from "@/components/app-search"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

interface App {
  display_name: string
  publisher: string
  description: string
  icon_image: string
  app_slots: number
  categories: string[]
  created_at: string
}

interface AppFilterClientProps {
  initialApps: App[]
  categories: string[]
  initialCategory?: string
  initialSearch?: string
}

export function AppFilterClient({
  initialApps,
  categories,
  initialCategory,
  initialSearch,
}: AppFilterClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get query parameters
  const urlSearchTerm = searchParams.get("q") || ""
  const urlCategory = searchParams.get("category") || "all"
  const initialAppSlots = searchParams.get("slots")
    ? Number(searchParams.get("slots"))
    : null
  const initialSortBy = searchParams.get("sort") || "name"

  // Set up state for filtering
  const apps = initialApps
  const [searchTerm, setSearchTerm] = useState(initialSearch || urlSearchTerm)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || urlCategory
  )
  const [appSlots, setAppSlots] = useState<number | null>(initialAppSlots)
  const [sortBy, setSortBy] = useState<string>(initialSortBy)
  const [filteredApps, setFilteredApps] = useState<App[]>(initialApps)

  // Track previous URL to prevent unnecessary updates
  const prevUrlRef = useRef<string>("")

  // Update URL when filters change
  const updateUrl = useCallback(
    (search: string, category: string, slots: number | null, sort: string) => {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (category !== "all") params.set("category", category)
      if (slots) params.set("slots", slots.toString())
      if (sort !== "name") params.set("sort", sort)

      const newUrl = `${pathname}${params.toString() ? "?" + params.toString() : ""}`

      // Only update URL if it has actually changed
      if (newUrl !== prevUrlRef.current) {
        prevUrlRef.current = newUrl
        router.push(newUrl, { scroll: false })
      }
    },
    [pathname, router]
  )

  // Apply filters and sorting
  useEffect(() => {
    let result = [...apps]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (app) =>
          app.display_name.toLowerCase().includes(term) ||
          app.description.toLowerCase().includes(term)
      )
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(
        (app) => app.categories && app.categories.includes(selectedCategory)
      )
    }

    // Apply app slots filter
    if (appSlots !== null) {
      result = result.filter((app) => app.app_slots === appSlots)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.display_name.localeCompare(b.display_name)
        case "created_date":
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          )
        default:
          return 0
      }
    })

    setFilteredApps(result)

    // Debounce URL updates to prevent excessive rerenders
    const timer = setTimeout(() => {
      updateUrl(searchTerm, selectedCategory, appSlots, sortBy)
    }, 300)

    return () => clearTimeout(timer)
  }, [apps, searchTerm, selectedCategory, appSlots, sortBy, updateUrl])

  // Handlers for filter changes
  const handleSearchChange = (value: string) => setSearchTerm(value)
  const handleCategoryChange = (value: string) => setSelectedCategory(value)
  const handleAppSlotsChange = (value: number | null) => setAppSlots(value)
  const handleSortChange = (value: string) => setSortBy(value)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Search card - appears first on mobile, second on desktop */}
        <div className="order-1 col-span-1 md:order-2">
          <div className="sticky top-20 z-30">
            <AppSearch
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
              appSlots={appSlots}
              onAppSlotsChange={handleAppSlotsChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* App grid - appears second on mobile, first on desktop */}
        <div className="order-2 col-span-1 md:order-1 md:col-span-3">
          <AppGrid apps={filteredApps} isLoading={false} error={null} />
        </div>
      </div>
    </>
  )
}
