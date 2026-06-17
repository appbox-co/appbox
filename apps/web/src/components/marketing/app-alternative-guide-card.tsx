import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"

interface AlternativeGuide {
  href: string
  title: string
  description: string
}

const alternativeGuidesByApp: Record<string, AlternativeGuide> = {
  jellyfin: {
    href: "/alternativesto/plex",
    title: "Compare Plex alternatives",
    description:
      "See how Jellyfin on Appbox compares with Plex, Emby, and Kodi."
  },
  emby: {
    href: "/alternativesto/plex",
    title: "Compare Plex alternatives",
    description:
      "See how Emby on Appbox compares with Plex, Jellyfin, and Kodi."
  },
  plane: {
    href: "/alternativesto/monday",
    title: "Compare Monday.com alternatives",
    description:
      "See how Plane on Appbox compares with Monday.com, ERPNext, ClickUp, and Asana."
  },
  erpnext: {
    href: "/alternativesto/monday",
    title: "Compare Monday.com alternatives",
    description:
      "See how ERPNext on Appbox compares with Monday.com, Plane, ClickUp, and Asana."
  }
}

interface AppAlternativeGuideCardProps {
  appName: string
  className?: string
}

function normalizeAppName(appName: string) {
  return appName.trim().toLowerCase()
}

export function AppAlternativeGuideCard({
  appName,
  className
}: AppAlternativeGuideCardProps) {
  const guide = alternativeGuidesByApp[normalizeAppName(appName)]

  if (!guide) {
    return null
  }

  return (
    <section
      aria-label="Related alternative comparison"
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-5 shadow-xs",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Related comparison
      </p>
      <h2 className="mt-2 text-lg font-semibold">{guide.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {guide.description}
      </p>
      <Link
        href={guide.href}
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}
      >
        Read guide
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </section>
  )
}
