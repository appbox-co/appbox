/**
 * Loads the MDX files in apps/content (docs, blog and policies) and validates
 * their frontmatter. Server-only: it reads from disk, so client components
 * must receive content through props.
 *
 * Documents keep the shape Contentlayer generated (`_id`, `_raw`, `body.raw`,
 * `slug`, `slugAsParams`), apart from `body.code`: pages compile MDX when they
 * render, through `<Mdx>`.
 */
import fs from "node:fs"
import path from "node:path"
import { cache } from "react"
import { parse as parseYaml } from "yaml"
import { z } from "zod"
import { blogConfig } from "@/config/blog"
import {
  nextLaunchWeekFlags,
  type NextLaunchWeekFlag
} from "@/config/launch-week-flags"
import type { PostAuthor } from "@/lib/opendocs/types/blog"

// The build traces the file reads below from this path and bundles the MDX
// files with every route that imports this module, so keep it static.
export const contentDir = path.join(process.cwd(), "../content")

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

interface BaseDocument {
  _id: string
  _raw: {
    sourceFilePath: string
    sourceFileName: string
    sourceFileDir: string
    contentType: "mdx"
    flattenedPath: string
  }
  body: { raw: string }
  slug: string
  slugAsParams: string
}

const links = z
  .object({
    doc: z.string(),
    blog: z.string(),
    api: z.string(),
    source: z.string()
  })
  .partial()
  .optional()

// A date without a time zone is read as UTC, so dates don't depend on where the
// site is built. Contentlayer used the build machine's time zone.
const isoDate = z.union([z.string(), z.date()]).transform((value, ctx) => {
  let date = value instanceof Date ? value : undefined

  if (typeof value === "string") {
    const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(value)
    date = new Date(
      value.includes(":") && !hasZone ? `${value.replace(" ", "T")}Z` : value
    )
  }

  if (!date || Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: "custom", message: `Invalid date "${value}"` })
    return z.NEVER
  }

  return date.toISOString()
})

const launchDays = Object.keys(nextLaunchWeekFlags) as [
  NextLaunchWeekFlag,
  ...NextLaunchWeekFlag[]
]

const docSchema = z.object({
  title: z.string(),
  description: z.string(),
  sort: z.number().optional(),
  links,
  toc: z.boolean().default(true),
  // The next Launch Week day that publishes this page.
  launch: z.enum(launchDays).optional()
})

const blogSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: isoDate,
  author_id: z.string().optional(),
  og_image: z.string().optional(),
  links,
  tags: z.array(z.string())
})

const policySchema = z.object({
  title: z.string(),
  description: z.string(),
  toc: z.boolean().default(true)
})

export type Doc = BaseDocument & z.infer<typeof docSchema> & { type: "Doc" }

export type Blog = BaseDocument &
  z.infer<typeof blogSchema> & {
    type: "Blog"
    author: Omit<PostAuthor, "bio"> & { bio?: string }
    readTimeInMinutes: number
  }

export type Policy = BaseDocument &
  z.infer<typeof policySchema> & { type: "Policy" }

function listMdxFiles(dir: string) {
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.split(path.sep).join("/"))
    .sort()
}

function readDocument<T extends z.ZodObject>(
  collection: string,
  file: string,
  schema: T
): BaseDocument & z.infer<T> {
  const sourceFilePath = `${collection}/${file}`
  const source = fs.readFileSync(path.join(contentDir, sourceFilePath), "utf8")
  const match = FRONTMATTER.exec(source)
  let frontmatter: unknown = {}

  if (match) {
    try {
      frontmatter = parseYaml(match[1]) ?? {}
    } catch (error) {
      // The parser's message doesn't name the file, so add it.
      const message = error instanceof Error ? error.message : String(error)
      const summary = message.split("\n")[0].replace(/:$/, "")
      throw new Error(`${sourceFilePath}\n  frontmatter: ${summary}`)
    }
  }

  const data = schema.safeParse(frontmatter)

  if (!data.success) {
    const issues = data.error.issues
      .map((issue) => `  ${issue.path.join(".") || "frontmatter"}: ${issue.message}`)
      .join("\n")

    throw new Error(`${sourceFilePath}\n${issues}`)
  }

  const flattenedPath = sourceFilePath
    .replace(/\.mdx$/, "")
    .replace(/(^|\/)index$/, "")

  const document: BaseDocument = {
    _id: sourceFilePath,
    _raw: {
      sourceFilePath,
      sourceFileName: path.posix.basename(sourceFilePath),
      sourceFileDir: path.posix.dirname(sourceFilePath),
      contentType: "mdx",
      flattenedPath
    },
    body: { raw: match ? source.slice(match[0].length) : source },
    slug: `/${flattenedPath}`,
    slugAsParams: flattenedPath.split("/").slice(1).join("/")
  }

  return { ...(data.data as z.infer<T>), ...document }
}

/**
 * A page with `launch: day_N` stays out of every docs list (pages, sidebar,
 * search, sitemap) until that day's next Launch Week flag is on.
 * LAUNCH_PREVIEW=1, for Vercel previews, includes it anyway.
 */
function isLaunched(launch: NextLaunchWeekFlag | undefined) {
  return (
    !launch || nextLaunchWeekFlags[launch] || process.env.LAUNCH_PREVIEW === "1"
  )
}

/** `compute` returns null to leave a file out of the collection. */
function defineCollection<T extends z.ZodObject, D>(
  collection: string,
  schema: T,
  compute: (document: BaseDocument & z.infer<T>) => D | null
) {
  const dir = path.join(contentDir, collection)
  let loaded: { signature: string; documents: D[] } | undefined

  // A page reads each collection several times, so check the files for
  // changes once per request.
  return cache(function getAll(): D[] {
    if (loaded && process.env.NODE_ENV === "production") {
      return loaded.documents
    }

    const files = listMdxFiles(dir)

    // Development reloads a collection when any of its files change.
    const signature = files
      .map((file) => `${file}:${fs.statSync(path.join(dir, file)).mtimeMs}`)
      .join("|")

    if (loaded?.signature === signature) {
      return loaded.documents
    }

    const errors: string[] = []
    const documents: D[] = []

    for (const file of files) {
      try {
        const document = compute(readDocument(collection, file, schema))
        if (document !== null) documents.push(document)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }

    if (errors.length > 0) {
      const message = `Invalid frontmatter in ${errors.length} ${collection} file(s):\n${errors.join("\n")}`

      // A build fails on any bad file. In development, leave the file out
      // instead, so one bad page doesn't break every page that lists content.
      if (process.env.NODE_ENV === "production") {
        throw new Error(message)
      }

      console.error(message)
    }

    loaded = { signature, documents }
    return documents
  })
}

export const getAllDocs = defineCollection(
  "docs",
  docSchema,
  (doc): Doc | null => (isLaunched(doc.launch) ? { ...doc, type: "Doc" } : null)
)

export const getAllBlogs = defineCollection("blog", blogSchema, (post): Blog => {
  const [, locale] = post._raw.sourceFileDir.split("/")
  const author = blogConfig.authors.find(
    (author) => author.id === post.author_id
  )
  const words = post.body.raw.trim().split(/\s+/).length

  return {
    ...post,
    type: "Blog",
    author: author
      ? {
          ...author,
          bio:
            author.bio?.[locale as keyof typeof author.bio] || author.bio?.en
        }
      : { id: post.author_id },
    readTimeInMinutes: Math.ceil(words / 200)
  }
})

export const getAllPolicies = defineCollection(
  "policies",
  policySchema,
  (policy): Policy => ({ ...policy, type: "Policy" })
)
