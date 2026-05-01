import { getApps } from "@/api/appbox/apps"
import { ClientAppsMarquee } from "@/components/marketing/client-apps-marquee"

interface AppsMarqueeProps {
  headline1: string
  headline2: string
  description: string
}

interface App {
  display_name: string
  publisher: string
  description: string
  icon_image: string
  categories: string[]
  installs?: number
}

export async function AppsMarquee({
  headline1,
  headline2,
  description
}: AppsMarqueeProps) {
  // Fetch apps on the server
  let apps: App[] = []
  try {
    apps = await getApps()
  } catch (error) {
    console.error("Error fetching apps for marquee:", error)
  }

  // If no apps, return early
  if (!apps || apps.length === 0) {
    return null
  }

  // Sort by installs to show popular apps first
  const sortedApps = [...apps].sort(
    (a, b) => (b.installs || 0) - (a.installs || 0)
  )

  // Split into two rows
  const midpoint = Math.ceil(sortedApps.length / 2)
  const firstRow = sortedApps.slice(0, midpoint)
  const secondRow = sortedApps.slice(midpoint)

  return (
    <section className="py-20 sm:py-28">
      <div>
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {headline1}
            <br />
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {headline2}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-16">
          <ClientAppsMarquee firstRow={firstRow} secondRow={secondRow} />
        </div>
      </div>
    </section>
  )
}
