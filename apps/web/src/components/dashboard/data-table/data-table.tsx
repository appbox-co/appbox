"use client"

import { useState } from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  RowSelectionState,
  SortingState,
  VisibilityState
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

/* -------------------------------------------------------------------------- */
/*  Custom filter functions                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Filter function for faceted (multi-select) filters.
 * The filter value is an array of accepted values; the row passes if its cell
 * value is included in that array.
 */

const arrIncludesSome: FilterFn<Record<string, unknown>> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue || filterValue.length === 0) return true
  const cellValue = String(row.getValue(columnId) ?? "")
  return filterValue.includes(cellValue)
}
arrIncludesSome.autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0)

/* -------------------------------------------------------------------------- */
/*  Skeleton helper (inline – no separate ui/skeleton dependency)             */
/* -------------------------------------------------------------------------- */

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-md", className)} />
}

/* -------------------------------------------------------------------------- */
/*  DataTable                                                                  */
/* -------------------------------------------------------------------------- */

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: import("./data-table-faceted-filter").FacetedFilterOption[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Filter a single specific column. Mutually exclusive with globalSearch. */
  searchKey?: string
  /**
   * When true, the search input uses TanStack's global filter which matches
   * across ALL string columns simultaneously (name, domain, appbox, etc.).
   */
  globalSearch?: boolean
  searchPlaceholder?: string
  toolbar?: React.ReactNode
  /** Declarative faceted filter configs; DataTable resolves columns internally */
  facetedFilters?: FacetedFilterConfig[]
  onRowClick?: (
    row: TData,
    event?: React.MouseEvent<HTMLTableRowElement>
  ) => void
  isLoading?: boolean
  emptyMessage?: string
  pageSize?: number
  pageSizeOptions?: number[]
  className?: string
  enableRowSelection?: boolean
  getRowId?: (originalRow: TData, index: number) => string
  renderBulkActions?: (args: {
    selectedRows: TData[]
    clearSelection: () => void
  }) => React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  globalSearch = false,
  searchPlaceholder,
  toolbar,
  facetedFilters,
  onRowClick,
  isLoading = false,
  emptyMessage = "No results.",
  pageSize = 10,
  pageSizeOptions,
  className,
  enableRowSelection = false,
  getRowId,
  renderBulkActions
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table API returns unstable function refs
  const table = useReactTable({
    data,
    columns,
    filterFns: {
      arrIncludesSome
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(enableRowSelection ? { rowSelection } : {}),
      ...(globalSearch ? { globalFilter } : {})
    },
    initialState: {
      pagination: { pageSize }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableRowSelection ? { onRowSelectionChange: setRowSelection } : {}),
    ...(globalSearch
      ? {
          onGlobalFilterChange: setGlobalFilter,
          globalFilterFn: "includesString"
        }
      : {}),
    ...(enableRowSelection ? { enableRowSelection: true } : {}),
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const resolvedFacetedFilters = facetedFilters?.length ? (
    <>
      {facetedFilters.map((f) => (
        <DataTableFacetedFilter
          key={f.columnId}
          column={table.getColumn(f.columnId)}
          title={f.title}
          options={f.options}
        />
      ))}
    </>
  ) : undefined

  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)
  const resolvedToolbar = (
    <>
      {renderBulkActions?.({
        selectedRows,
        clearSelection: () => table.resetRowSelection()
      })}
      {toolbar}
    </>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <DataTableToolbar
        table={table}
        searchKey={globalSearch ? undefined : searchKey}
        globalFilter={globalSearch ? globalFilter : undefined}
        onGlobalFilterChange={globalSearch ? setGlobalFilter : undefined}
        searchPlaceholder={searchPlaceholder}
        facetedFilters={resolvedFacetedFilters}
        toolbar={resolvedToolbar}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={(event) => onRowClick?.(row.original, event)}
                  onAuxClick={(event) => {
                    if (event.button === 1) onRowClick?.(row.original, event)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  )
}
