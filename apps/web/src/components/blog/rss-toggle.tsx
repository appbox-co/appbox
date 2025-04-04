"use client"

import { useState, type PointerEvent } from "react"
import { useLocale } from "next-intl"
import ExternalLink from "next/link"
import { Rss } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { blogConfig } from "@/config/blog"
import { useIsMobile } from "@/lib/opendocs/hooks/use-is-mobile"
import { cn } from "@/lib/utils"

interface RSSToggleProps {
  messages: {
    rss_feed: string
  }
}

export function RSSToggle({ messages }: RSSToggleProps) {
  const isMobile = useIsMobile()
  const currentLocale = useLocale()

  const [open, setOpen] = useState(false)

  function openDropdown() {
    setOpen(() => true)
  }

  function closeDropdown(element: PointerEvent<HTMLElement>) {
    const target = element.relatedTarget as Element

    if ("closest" in target && target.closest("[role=menu]")) return

    setOpen(() => false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "group pointer-events-auto relative flex w-fit gap-1 place-self-end px-2 transition-all",
            buttonVariants({ variant: "ghost" }),
            "hover:text-amber-600",
            "aria-expanded:text-amber-600"
          )}
          aria-expanded={open}
          aria-label={messages.rss_feed}
          onClick={() => isMobile && openDropdown()}
          onPointerEnter={() => !isMobile && openDropdown()}
          onPointerLeave={(event) => !isMobile && closeDropdown(event)}
        >
          <Rss
            className="size-[1.2rem] transition-all dark:rotate-0 dark:scale-100"
            size={20}
          />

          <span className="sr-only">{messages.rss_feed}</span>
          <span className="pointer-events-auto absolute z-10 block h-14 w-full" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        role="menu"
        align="center"
        onPointerLeave={closeDropdown}
        className="flex flex-col items-center"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full">
          {blogConfig.rss.map(({ file, type }) => (
            <DropdownMenuItem asChild key={file}>
              <ExternalLink
                target="_blank"
                rel="noreferrer"
                aria-label={type}
                href={`/${currentLocale}/feed/${file}`}
              >
                {type}
              </ExternalLink>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
