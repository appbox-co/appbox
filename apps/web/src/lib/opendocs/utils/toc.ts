import { toc } from "mdast-util-toc"
import { remark } from "remark"
import { visit } from "unist-util-visit"

const textTypes = ["text", "emphasis", "strong", "inlineCode"]

interface Item {
  title: string
  url: string
  items?: Item[]
}

interface Items {
  items?: Item[]
}

interface MdastNode {
  type: string
  value?: string
  url?: string
  children?: MdastNode[]
}

function flattenNode(node: MdastNode): string {
  const p: string[] = []

  visit(node, (node) => {
    if (!textTypes.includes(node.type)) return
    p.push(node.value || "")
  })

  return p.join(``)
}

function getItems(node: MdastNode | null, current: Partial<Item>): Item {
  if (!node) {
    return { title: "", url: "" }
  }

  if (node.type === "paragraph") {
    visit(node, (item) => {
      if (item.type === "link") {
        current.url = item.url
        current.title = flattenNode(node)
      }

      if (item.type === "text") {
        current.title = flattenNode(node)
      }
    })

    return current as Item
  }

  if (node.type === "list") {
    current.items = node.children?.map((i: MdastNode) => getItems(i, {})) || []

    return current as Item
  } else if (node.type === "listItem") {
    const heading = getItems(node.children?.[0] ?? null, {})

    if (node.children && node.children.length > 1) {
      getItems(node.children[1] ?? null, heading)
    }

    return heading
  }

  return {} as Item
}

function getToc() {
  return function (tree: unknown, file: { data: unknown }) {
    // @ts-expect-error We know this works at runtime
    const table = toc(tree)
    const items = getItems(table.map ?? null, {})

    // Assign to file.data
    file.data = items
  }
}

export type TableOfContents = Items

export async function getTableOfContents(
  content: string
): Promise<TableOfContents> {
  const result = await remark().use(getToc).process(content)

  return result.data as TableOfContents
}
