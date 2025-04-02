"use client"

import { Link, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import type { LinkProps } from "next/link"
import React from "react"

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

  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString())
        onOpenChange?.(false)
      }}
      className={cn(className)}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </Link>
  )
}
