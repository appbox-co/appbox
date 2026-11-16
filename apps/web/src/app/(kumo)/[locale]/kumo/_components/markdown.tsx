"use client"

import { Link as KumoLink } from "@cloudflare/kumo"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { isSafeMarkdownHref } from "@/lib/marketing/safe-urls"

const EXTERNAL_HREF = /^(https?:|mailto:|tel:)/

/**
 * App descriptions are Markdown from the catalogue. Rendered with the same
 * parser and link safety check as the current design, styled with Kumo tokens
 * (the typography plugin's `prose` classes are not loaded in this tree).
 */
export function Markdown({ content }: { content?: string | null }) {
  const value = content?.trim()

  if (!value) {
    return <p className="text-kumo-subtle">No description yet.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // The page already has an h1 and section h2s, so headings start at h3.
          h1: ({ children }) => (
            <h3 className="mt-2 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-2 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-1 font-medium first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="grid list-disc gap-1 ps-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="grid list-decimal gap-1 ps-5">{children}</ol>
          ),
          strong: ({ children }) => (
            <strong className="font-medium">{children}</strong>
          ),
          hr: () => <hr className="border-kumo-hairline" />,
          blockquote: ({ children }) => (
            <blockquote className="border-s-2 border-kumo-line ps-3 text-kumo-subtle">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            if (!href || !isSafeMarkdownHref(href)) {
              return <span>{children}</span>
            }
            if (!EXTERNAL_HREF.test(href)) {
              return <KumoLink href={href}>{children}</KumoLink>
            }
            // A bare "Source" link reads better as the site it points to.
            const text =
              children === "Source" || children === "source"
                ? new URL(href).hostname.replace(/^www\./, "")
                : children
            return (
              <KumoLink href={href} target="_blank" rel="noopener noreferrer">
                {text}
                <KumoLink.ExternalIcon />
              </KumoLink>
            )
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-kumo-tint p-3 font-mono text-sm">
              {children}
            </pre>
          ),
          code: ({ children, className }) =>
            className?.includes("language-") ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded bg-kumo-tint px-1 py-0.5 font-mono text-[0.9em]">
                {children}
              </code>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-kumo-line px-2 py-1.5 font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-kumo-hairline px-2 py-1.5">
              {children}
            </td>
          )
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
