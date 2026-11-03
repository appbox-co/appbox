import type { EvaluateOptions } from "@mdx-js/mdx"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypePrettyCode, { type Options } from "rehype-pretty-code"
import rehypeSlug from "rehype-slug"
import { codeImport } from "remark-code-import"
import remarkGfm from "remark-gfm"
import { visit } from "unist-util-visit"
import { getContentLayerCodeTheme } from "@/lib/opendocs/utils/code-theme"
import { rehypeNpmCommand } from "@/lib/opendocs/utils/rehype-npm-command"

/* eslint-disable @typescript-eslint/no-explicit-any -- hast nodes carry ad-hoc properties between these plugins */
export const mdxOptions: Pick<
  EvaluateOptions,
  "remarkPlugins" | "rehypePlugins"
> = {
  remarkPlugins: [remarkGfm, codeImport],

  rehypePlugins: [
    rehypeSlug,
    () => (tree) => {
      visit(tree, (node: any) => {
        if (node?.type === "element" && node?.tagName === "pre") {
          const [codeEl] = node.children
          if (codeEl.tagName !== "code") {
            return
          }

          node.__rawString__ = codeEl.children?.[0].value
          node.__src__ = node.properties?.__src__
          node.__style__ = node.properties?.__style__
        }
      })
    },

    [
      rehypePrettyCode,
      {
        keepBackground: false,
        theme: getContentLayerCodeTheme(),

        onVisitLine(node) {
          // Prevent lines from collapsing in `display: grid` mode, and allow empty
          // lines to be copy/pasted
          if (node.children.length === 0) {
            node.children = [{ type: "text", value: " " }]
          }
        },

        onVisitHighlightedLine(node) {
          node?.properties?.className?.push("line--highlighted")
        },

        onVisitHighlightedChars(node) {
          node.properties.className = ["word--highlighted"]
        }
      } as Options
    ],

    () => (tree) => {
      visit(tree, (node: any) => {
        if (node?.type === "element" && !!node?.tagName) {
          const preElement = node?.children?.at(-1)

          if (preElement?.tagName !== "pre") {
            return
          }

          preElement.properties["__withMeta__"] =
            node?.children?.at(0)?.tagName === "div"

          preElement.properties["__rawString__"] = node?.__rawString__

          if (node?.__src__) {
            preElement.properties["__src__"] = node.__src__
          }

          if (node?.__style__) {
            preElement.properties["__style__"] = node.__style__
          }
        }
      })
    },

    rehypeNpmCommand,

    [
      rehypeAutolinkHeadings,

      {
        properties: {
          ariaLabel: "Link to section",
          className: ["subheading-anchor"]
        }
      }
    ]
  ]
}
/* eslint-enable @typescript-eslint/no-explicit-any */
