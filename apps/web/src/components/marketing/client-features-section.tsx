"use client"

import { ReactNode } from "react"
import {
  FileText,
  HeadphonesIcon,
  MonitorIcon,
  MousePointerClick,
  Network,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  Zap
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

interface FeatureItemProps {
  area: string
  icon: ReactNode
  title: string
  description: string
}

const FeatureItem = ({ area, icon, title, description }: FeatureItemProps) => {
  return (
    <li className={`min-h-56 list-none ${area}`}>
      <div className="bg-background/20 relative h-full rounded-2xl border p-2 backdrop-blur-xs md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="w-fit rounded-lg border border-gray-600 p-2">
            {icon}
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-center">
            <div className="space-y-3">
              <h3 className="-tracking-4 text-balance pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

interface ClientFeaturesSectionProps {
  features: {
    root_access: { title: string; description: string }
    remote_desktop: { title: string; description: string }
    one_click: { title: string; description: string }
    community: { title: string; description: string }
    security: { title: string; description: string }
    deploy_fast: { title: string; description: string }
    custom_hardware: { title: string; description: string }
    custom_network: { title: string; description: string }
    support: { title: string; description: string }
    documentation: { title: string; description: string }
  }
}

export function ClientFeaturesSection({
  features
}: ClientFeaturesSectionProps) {
  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Row 1: 4 features */}
        <FeatureItem
          area="md:col-span-1 lg:col-span-1"
          icon={
            <Terminal className="size-4 text-black dark:text-neutral-400" />
          }
          title={features.root_access.title}
          description={features.root_access.description}
        />

        <FeatureItem
          area="md:col-span-1 lg:col-span-1"
          icon={
            <MonitorIcon className="size-4 text-black dark:text-neutral-400" />
          }
          title={features.remote_desktop.title}
          description={features.remote_desktop.description}
        />

        <FeatureItem
          area="md:col-span-1 lg:col-span-2"
          icon={
            <MousePointerClick className="size-4 text-black dark:text-neutral-400" />
          }
          title={features.one_click.title}
          description={features.one_click.description}
        />

        {/* Row 2: 3 features */}
        <FeatureItem
          area="md:col-span-2 lg:col-span-2"
          icon={<Users className="size-4 text-black dark:text-neutral-400" />}
          title={features.community.title}
          description={features.community.description}
        />

        <FeatureItem
          area="md:col-span-1 lg:col-span-1"
          icon={<Zap className="size-4 text-black dark:text-neutral-400" />}
          title={features.deploy_fast.title}
          description={features.deploy_fast.description}
        />

        <FeatureItem
          area="md:col-span-3 lg:col-span-1"
          icon={<Server className="size-4 text-black dark:text-neutral-400" />}
          title={features.custom_hardware.title}
          description={features.custom_hardware.description}
        />

        {/* Row 3: 3 features */}
        <FeatureItem
          area="md:col-span-1 lg:col-span-1"
          icon={<Network className="size-4 text-black dark:text-neutral-400" />}
          title={features.custom_network.title}
          description={features.custom_network.description}
        />

        <FeatureItem
          area="md:col-span-1 lg:col-span-1"
          icon={
            <HeadphonesIcon className="size-4 text-black dark:text-neutral-400" />
          }
          title={features.support.title}
          description={features.support.description}
        />

        <FeatureItem
          area="md:col-span-1 lg:col-span-2"
          icon={
            <FileText className="size-4 text-black dark:text-neutral-400" />
          }
          title={features.documentation.title}
          description={features.documentation.description}
        />
      </ul>

      {/* Security feature in its own row */}
      <div className="w-full">
        <FeatureItem
          area=""
          icon={
            <ShieldCheck className="size-5 text-black dark:text-neutral-400" />
          }
          title={features.security.title}
          description={features.security.description}
        />
      </div>
    </div>
  )
}
