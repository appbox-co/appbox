/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og"
import { allBlogs, type Blog } from "contentlayer/generated"
import { siteConfig } from "@/config/site"
import { getFonts } from "@/lib/og-fonts"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"
import { truncateText } from "@/lib/utils"

export const dynamic = "force-dynamic"

// Fallback URL if NEXT_PUBLIC_APP_URL is not defined
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Create a safe absolute URL function that works even if NEXT_PUBLIC_APP_URL is undefined
function safeAbsoluteUrl(path: string) {
  // Ensure path starts with a slash
  const safePath = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${safePath}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; locale: string }> }
) {
  const resolvedParams = await params
  const locale = resolvedParams.locale as LocaleOptions
  const post = getBlogPostBySlugAndLocale(resolvedParams.slug, locale)

  if (!post) {
    return new ImageResponse(<Fallback src="/og.jpg" />, {
      ...siteConfig.og.size
    })
  }

  const { bold, regular } = await getFonts()

  return new ImageResponse(
    <div
      tw={`bg-black flex flex-col min-w-full h-[${siteConfig.og.size.height}px] relative`}
    >
      <Background src="/og-background.jpg" />

      <div tw="my-10 mx-14 flex flex-col">
        <Logo src="/appbox-box-white.svg" />

        <div tw="flex flex-col h-full max-h-[300px]">
          <Title>{post.title}</Title>
          <Author post={post} />
        </div>
      </div>
    </div>,
    {
      ...siteConfig.og.size,
      fonts: [
        {
          name: "Geist",
          data: regular,
          style: "normal",
          weight: 400
        },
        {
          name: "Geist",
          data: bold,
          style: "normal",
          weight: 700
        }
      ]
    }
  )
}

function Author({ post }: { post: Blog }) {
  return (
    <div tw="flex items-center pt-10">
      {post.author?.image && (
        <img
          tw="w-20 h-20 rounded-full border-gray-800 border-4"
          src={safeAbsoluteUrl(post.author?.image)}
          alt=""
        />
      )}

      <span tw="ml-3 text-gray-400 text-3xl">{post.author?.name}</span>
    </div>
  )
}

function Background({ src }: { src: string }) {
  return (
    <img
      alt=""
      src={safeAbsoluteUrl(src)}
      tw="w-full h-full absolute left-0 top-0 opacity-70"
    />
  )
}

function Logo({ src }: { src: string }) {
  return <img tw="w-28 h-28" src={safeAbsoluteUrl(src)} alt="" />
}

function Title({ children }: { children: string }) {
  return (
    <div tw="pt-4 flex flex-col h-full justify-center">
      <h1 tw="text-white text-7xl w-full">{truncateText(children)}</h1>
    </div>
  )
}

function Fallback({ src }: { src: string }) {
  return (
    <div tw="flex w-full h-full">
      <img src={safeAbsoluteUrl(src)} tw="w-full h-full" alt="" />
    </div>
  )
}

function getBlogPostBySlugAndLocale(slug: string, locale: LocaleOptions) {
  return allBlogs.find((post) => {
    const [postLocale, ...slugs] = post.slugAsParams.split("/")

    return slugs.join("/") === slug && postLocale === locale
  })
}
