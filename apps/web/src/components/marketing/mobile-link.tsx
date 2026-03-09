"use client"

import * as React from "react"
import type { LinkProps } from "next/link"
import { Link, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export interface MobileLinkProps extends Omit<LinkProps, "locale"> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

export function MobileLink({
  href,
  children,
  className,
  onOpenChange,
  target,
  rel,
  ...props
}: MobileLinkProps) {
  const router = useRouter()

  // Handle click event
  const handleClick = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle internal navigation with router.push
    if (href.toString().startsWith("/") || href.toString().startsWith("#")) {
      router.push(href.toString())
    }

    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(className)}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </Link>
  )
}
