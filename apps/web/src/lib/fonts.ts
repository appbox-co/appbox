import { JetBrains_Mono as FontMono } from "next/font/google"
import { GeistSans } from "geist/font/sans"

export const fontSans = GeistSans

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono"
})

export async function getFonts() {
  const [bold, regular] = await Promise.all([
    fetch(
      new URL(
        "/fonts/Geist-Bold.ttf",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    ).then((res) => res.arrayBuffer()),

    fetch(
      new URL(
        "/fonts/Geist-Regular.ttf",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    ).then((res) => res.arrayBuffer())
  ])

  return {
    bold,
    regular
  }
}
