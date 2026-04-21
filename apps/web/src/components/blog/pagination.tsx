import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Pagination as RawPagination
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface PaginationProps {
  numberOfPages: number
  currentPage: number
  pagesToShow?: number
  currentTag?: string | null

  messages: {
    next: string
    previous: string
    go_to_next_page: string
    go_to_previous_page: string
  }
}

function buildPageHref(page: number, tag: string | null | undefined): string {
  const params = new URLSearchParams()
  if (tag) params.set("tag", tag)
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

export function Pagination({
  messages,
  numberOfPages,
  currentPage,
  currentTag,
  pagesToShow = 5
}: PaginationProps) {
  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < numberOfPages

  let visiblePages: number[]
  if (numberOfPages <= pagesToShow) {
    visiblePages = Array.from({ length: numberOfPages }, (_, index) => index + 1)
  } else {
    const startPages = [1, 2]
    const endPages = [numberOfPages - 1, numberOfPages]
    const middlePages = [
      currentPage - 1,
      currentPage,
      currentPage + 1
    ].filter((page) => page > 2 && page < numberOfPages - 1)
    visiblePages = [...new Set([...startPages, ...middlePages, ...endPages])]
  }

  return (
    <RawPagination className="flex justify-center overflow-x-auto">
      <PaginationContent className="flex flex-wrap items-end space-x-2 space-y-2 sm:space-x-3 sm:space-y-0">
        <PaginationItem>
          <PaginationPrevious
            href={
              hasPreviousPage
                ? buildPageHref(currentPage - 1, currentTag)
                : "#"
            }
            aria-label={messages.go_to_previous_page}
            className={cn({
              "opacity-50 pointer-events-none": !hasPreviousPage
            })}
          >
            {messages.previous}
          </PaginationPrevious>
        </PaginationItem>

        {visiblePages.map((page, index) => {
          const isCurrentPage = page === currentPage

          const shouldDisplayEllipsis =
            index > 0 && page !== (visiblePages[index - 1] || 0) + 1

          return (
            <PaginationItem
              key={page}
              className={cn({
                "opacity-50 pointer-events-none": isCurrentPage
              })}
            >
              {shouldDisplayEllipsis ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink href={buildPageHref(page, currentTag)}>
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            href={
              hasNextPage ? buildPageHref(currentPage + 1, currentTag) : "#"
            }
            aria-label={messages.go_to_next_page}
            className={cn({ "opacity-50 pointer-events-none": !hasNextPage })}
          >
            {messages.next}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </RawPagination>
  )
}
