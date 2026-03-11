"use client"

import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownDescriptionProps {
  content?: string | null
  className?: string
}

function isSafeHref(href?: string): href is string {
  if (!href) return false

  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  )
}

export function MarkdownDescription({
  content,
  className
}: MarkdownDescriptionProps) {
  const value = content?.trim()

  if (!value) {
    return <p className="text-sm text-muted-foreground">No description yet.</p>
  }

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "text-muted-foreground",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-sm prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-muted-foreground/80",
        "prose-h2:first:mt-0",
        "prose-p:leading-relaxed",
        "prose-ul:my-2 prose-li:my-0.5",
        "prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:decoration-primary/30 hover:prose-a:decoration-primary",
        "prose-strong:text-foreground",
        "prose-hr:border-border",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-0 mb-3 text-base font-semibold text-foreground">
              {children}
            </h2>
          ),
          a: ({ href, children }) => {
            if (!isSafeHref(href)) {
              return <span>{children}</span>
            }

            const isExternal =
              href.startsWith("http://") ||
              href.startsWith("https://") ||
              href.startsWith("mailto:") ||
              href.startsWith("tel:")

            if (isExternal) {
              const displayText =
                children === "Source" || children === "source"
                  ? new URL(href).hostname.replace(/^www\./, "")
                  : children

              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {displayText}
                </a>
              )
            }

            return <Link href={href}>{children}</Link>
          },
          code: ({ children, className: codeClassName, ...props }) => {
            const isBlock = codeClassName?.includes("language-")

            if (isBlock) {
              return (
                <code
                  className={cn("block overflow-x-auto", codeClassName)}
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            )
          }
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
