"use client"

import { StarRating } from "@/components/ui/star-rating"

interface ClientStarRatingProps {
  value: number
  showcase?: boolean
  wrapperClassName?: string
}

export default function ClientStarRating({
  value,
  showcase = false,
  wrapperClassName,
}: ClientStarRatingProps) {
  return (
    <StarRating
      value={value}
      showcase={showcase}
      wrapperProps={{ className: wrapperClassName }}
    />
  )
}
