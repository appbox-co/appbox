import { cn } from "@cloudflare/kumo"
import { InstanceStatusBadge } from "../installed/instance-controls"
import { AppIcon } from "../ui/app-icon"
import { sampleDomain } from "./catalogue"

/** The top of an installed app's page on the sample Appbox "ada", as the scenes draw it. */
export function AppPageHeader({
  name,
  icon,
  status,
  className
}: {
  name: string
  icon: string
  status: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <AppIcon icon={icon} name={name} className="ks-appicon" />
      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="min-w-0 text-2xl font-semibold">{name}</h1>
          <InstanceStatusBadge status={status} />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-kumo-subtle">
          <span className="font-mono text-[0.9em]">{sampleDomain(name)}</span>
          <span aria-hidden="true">·</span>
          <span>
            on <span className="font-medium text-kumo-default">ada</span>
          </span>
        </p>
      </div>
    </div>
  )
}
