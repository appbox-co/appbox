"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { Check, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface FacetedFilterOption {
  label: string
  value: string
  /** Optional JSX rendered before the label (e.g. a colored dot) */
  icon?: React.ReactNode
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue> | undefined
  title: string
  options: FacetedFilterOption[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options
}: DataTableFacetedFilterProps<TData, TValue>) {
  const filterValue = column?.getFilterValue() as string[] | undefined
  const selected = new Set(filterValue ?? [])

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    column?.setFilterValue(next.size > 0 ? Array.from(next) : undefined)
  }

  const clear = () => column?.setFilterValue(undefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <PlusCircle className="mr-2 size-4" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selected.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selected.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selected.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((o) => selected.has(o.value))
                    .map((o) => (
                      <Badge
                        key={o.value}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {o.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-1">
          {options.map((option) => {
            const isSelected = selected.has(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggle(option.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isSelected && "font-medium"
                )}
              >
                <div
                  className={cn(
                    "flex size-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}
                >
                  {isSelected && <Check className="size-3" />}
                </div>
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate text-left">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
        {selected.size > 0 && (
          <>
            <Separator />
            <div className="p-1">
              <button
                onClick={clear}
                className="flex w-full items-center justify-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Clear filters
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
