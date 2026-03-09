"use client"

import type { Table } from "@tanstack/react-table"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  /** Global filter value (used instead of searchKey when globalSearch=true) */
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  searchPlaceholder?: string
  columnsLabel?: string
  /** Extra controls rendered between the search input and the Columns button */
  toolbar?: React.ReactNode
  /** Faceted filter components rendered inline after the search input */
  facetedFilters?: React.ReactNode
  className?: string
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = "Search...",
  columnsLabel = "Columns",
  toolbar,
  facetedFilters,
  className
}: DataTableToolbarProps<TData>) {
  const isColumnFiltered =
    searchKey &&
    (table.getColumn(searchKey)?.getFilterValue() as string)?.length > 0
  const isGlobalFiltered = globalFilter != null && globalFilter.length > 0
  const isFiltered = isColumnFiltered || isGlobalFiltered

  const hasActiveFilters =
    table.getState().columnFilters.length > 0 || isFiltered

  const searchValue =
    globalFilter != null
      ? globalFilter
      : (((searchKey
          ? table.getColumn(searchKey)?.getFilterValue()
          : undefined) as string) ?? "")

  const handleSearchChange = (value: string) => {
    if (onGlobalFilterChange) {
      onGlobalFilterChange(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  const handleClear = () => {
    if (onGlobalFilterChange) {
      onGlobalFilterChange("")
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue("")
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {(searchKey != null || globalFilter != null) && (
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-9 pl-8"
            />
            {isFiltered && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2"
                onClick={handleClear}
              >
                <X className="size-3.5" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        )}
        {facetedFilters}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground"
            onClick={() => {
              table.resetColumnFilters()
              if (onGlobalFilterChange) onGlobalFilterChange("")
            }}
          >
            Reset
            <X className="ml-1 size-3.5" />
          </Button>
        )}
        {toolbar}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 shrink-0">
            <SlidersHorizontal className="mr-2 size-4" />
            {columnsLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>{columnsLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
