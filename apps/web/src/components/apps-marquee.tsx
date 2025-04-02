import { getApps } from '@/lib/appbox/api/getApps'
import { ClientAppsMarquee } from '@/components/client-apps-marquee'

interface AppsMarqueeProps {
  title: string
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

export async function AppsMarquee({ title, description }: AppsMarqueeProps) {
  // Fetch apps on the server
  let apps: App[] = []
  try {
    apps = await getApps()
  } catch (error) {
    console.error('Error fetching apps for marquee:', error)
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
    <section className="py-12">
      <div className="container">
        <div className="mx-auto mb-10 max-w-[58rem] text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {description}
          </p>
        </div>

        <ClientAppsMarquee firstRow={firstRow} secondRow={secondRow} />
      </div>
    </section>
  )
}
