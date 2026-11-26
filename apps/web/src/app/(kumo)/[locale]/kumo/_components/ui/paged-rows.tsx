"use client"

import { useState } from "react"
import { Pagination } from "@cloudflare/kumo"
import {
  nextSort,
  sortRows,
  type Comparator,
  type SortState
} from "./sort-head"

/** The page sizes every list offers. */
const PAGE_SIZES = [10, 25, 50, 100]

interface PagedRowsOptions<Row, Key extends string> {
  sorters: Record<Key, Comparator<Row>>
  /** The order to start in; `null` keeps the rows as given. */
  defaultSort?: SortState<Key>
  /** Settles rows that the chosen column finds equal. */
  tieBreak?: Comparator<Row>
  /** The order with no column chosen. Without it the rows stay as given. */
  unsorted?: Comparator<Row>
  /** Rows a page to start with. */
  perPage?: number
}

/** Where a list is in its pages, for `PageFooter`. */
export interface Pager {
  page: number
  perPage: number
  total: number
  /** The sizes on offer: the shared list, plus the starting size if it is not in it. */
  sizes: number[]
  setPage: (page: number) => void
  setPerPage: (size: number) => void
}

/**
 * Sorting and paging for a list the view has already filtered. Choosing a
 * sort or a page size goes back to the first page; call `firstPage` when the
 * view's own filters change. A page past the end (after a filter shrinks the
 * list) shows the last one.
 */
export function usePagedRows<Row, Key extends string>(
  rows: readonly Row[],
  {
    sorters,
    defaultSort = null,
    tieBreak,
    unsorted,
    perPage: initialPerPage = PAGE_SIZES[0]
  }: PagedRowsOptions<Row, Key>
) {
  const [sort, setSortState] = useState<SortState<Key>>(defaultSort)
  const [page, setPage] = useState(1)
  const [perPage, setPerPageState] = useState(initialPerPage)

  const ordered =
    !sort && unsorted
      ? [...rows].sort(unsorted)
      : sortRows(rows, sort, sorters, tieBreak)
  const pageCount = Math.max(1, Math.ceil(ordered.length / perPage))
  const currentPage = Math.min(page, pageCount)

  const firstPage = () => setPage(1)
  const setSort = (next: SortState<Key>) => {
    setSortState(next)
    firstPage()
  }
  const sortBy = (key: Key) => {
    setSortState((current) => nextSort(current, key))
    firstPage()
  }

  const pager: Pager = {
    page: currentPage,
    perPage,
    total: ordered.length,
    sizes: [...new Set([...PAGE_SIZES, initialPerPage])].sort((a, b) => a - b),
    setPage,
    setPerPage: (size) => {
      setPerPageState(size)
      firstPage()
    }
  }

  return {
    /** The rows on the current page. */
    rows: ordered.slice((currentPage - 1) * perPage, currentPage * perPage),
    /** How many rows there are on every page together. */
    total: ordered.length,
    sort,
    setSort,
    sortBy,
    firstPage,
    pager
  }
}

/**
 * Page controls under a list: where it is, the page size, and the buttons.
 * Hidden while everything fits on the smallest page. `fixedSize` leaves out
 * the page size choice, for a list that always shows the same number.
 */
export function PageFooter({
  pager,
  fixedSize = false,
  className = "border-t border-kumo-hairline p-3"
}: {
  pager: Pager
  fixedSize?: boolean
  className?: string
}) {
  if (pager.total <= (fixedSize ? pager.perPage : pager.sizes[0])) return null

  return (
    <div className={className}>
      <Pagination
        page={pager.page}
        setPage={pager.setPage}
        perPage={pager.perPage}
        totalCount={pager.total}
        className="flex-wrap gap-y-3"
      >
        <Pagination.Info className="whitespace-nowrap" />
        {!fixedSize && (
          <Pagination.PageSize
            value={pager.perPage}
            options={pager.sizes}
            onChange={pager.setPerPage}
          />
        )}
        <Pagination.Controls />
      </Pagination>
    </div>
  )
}
