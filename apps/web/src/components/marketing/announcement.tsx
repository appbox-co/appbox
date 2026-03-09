import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/routing"

export function Announcement({
  title,
  href
}: {
  title: string
  href?: string
}) {
  return (
    <Link
      href={href ? href : "/docs/changelog"}
      className="bg-card-primary border-input group inline-flex items-center rounded-lg border px-3 py-1 text-sm font-medium"
    >
      🎉{" "}
      <Separator className="dark:bg-border mx-2 h-4" orientation="vertical" />{" "}
      <span className="sm:hidden">{title}</span>
      <span className="hidden sm:inline">{title}</span>
      <ArrowRightIcon className="ml-1 size-4 transition group-hover:translate-x-1" />
    </Link>
  )
}
