"use client"

import { cloneElement, useState } from "react";
import "@/styles/custom-styles.css"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { Button } from "@/components/ui/button"
import { SparklesText } from "@/components/ui/sparkles-text"

// Define types for billing cycle and pricing details
type BillingCycle =
  | ["monthly", "1M"]
  | ["quarterly", "3M"]
  | ["semiannually", "6M"]
  | ["annually", "12M"]

interface PricingDetail {
  per_month: string
  billed: string
}

interface Pricing {
  monthly: PricingDetail
  quarterly: PricingDetail
  semiannually: PricingDetail
  annually: PricingDetail
}

// Updated Plan interface – removed includes_media_apps and added new fields.
interface Plan {
  sort: number
  title: string
  short_title: string
  storage_capacity: string
  storage_type: string
  traffic: string
  app_slots: number
  recommended?: boolean
  available?: boolean
  connection_speed: string
  resources: string
  users_per_disk: number | string
  raid?: string
  number_of_disks?: number
  pricing: {
    EUR: Pricing
  }
}

interface Icon {
  type: string
  width: number | null
  height: number | null
}

interface Group {
  sort: number
  description: string
  slug: string
  title: string
  short_title: string
  plans: Plan[]
  icon: Icon
}

export interface PlansData {
  data: Group[]
}

interface PlansProps {
  data: Group[]
  messages: {
    billing_cycles: {
      monthly: string
      quarterly: string
      semiannually: string
      annually: string
      billed_every: string
    }
    card: {
      storage: string
      traffic: string
      app_slots: string
      connection_speed: string
      resource_multiplier: string
      users_per_disk: string
      raid: string
      disks: string
      per_month: string
      order_now: string
    }
  }
  gradientStartColor?: string
  gradientEndColor?: string
}

function interpolateColor(
  color1: string,
  color2: string,
  fraction: number
): string {
  // Parse hex
  const c1 = parseInt(color1.slice(1), 16)
  const r1 = (c1 >> 16) & 0xff
  const g1 = (c1 >> 8) & 0xff
  const b1 = c1 & 0xff

  const c2 = parseInt(color2.slice(1), 16)
  const r2 = (c2 >> 16) & 0xff
  const g2 = (c2 >> 8) & 0xff
  const b2 = c2 & 0xff

  // Interpolate each channel
  const r = Math.round(r1 + (r2 - r1) * fraction)
  const g = Math.round(g1 + (g2 - g1) * fraction)
  const b = Math.round(b1 + (b2 - b1) * fraction)

  // Convert back to hex
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  )
}

// Simplified version that uses just two colors
function getGradientColorForFraction(
  startColor: string,
  endColor: string,
  fraction: number
): string {
  return interpolateColor(startColor, endColor, fraction)
}

function getPlanGradient(
  idx: number,
  totalPlans: number,
  startGradientColor: string = "#00CCB1",
  endGradientColor: string = "#1CA0FB"
) {
  if (totalPlans < 1) {
    return `linear-gradient(to right, ${startGradientColor}, ${startGradientColor})`
  }

  // Calculate what fraction of the overall gradient this plan represents
  const startFraction = idx / totalPlans
  const endFraction = (idx + 1) / totalPlans

  // Sample colors from different positions in the gradient
  const startColor = getGradientColorForFraction(
    startGradientColor,
    endGradientColor,
    startFraction
  )
  const endColor = getGradientColorForFraction(
    startGradientColor,
    endGradientColor,
    endFraction
  )

  return `linear-gradient(to right, ${startColor}, ${endColor})`
}

// The Plans component
const Plans = ({
  data,
  messages,
  gradientStartColor = "#00CCB1",
  gradientEndColor = "#1CA0FB",
}: PlansProps) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>([
    "monthly",
    "1M",
  ])
  const billingCycles: BillingCycle[] = [
    ["monthly", "1M"],
    ["quarterly", "3M"],
    ["semiannually", "6M"],
    ["annually", "12M"],
  ]

  return (
    <div>
      {data.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="scroll-margin-t-16 scrollbar scrollbar-dark relative mx-auto overflow-y-hidden overflow-x-visible px-8 py-6 sm:m-0 sm:px-0"
        >
          <h4 className="mb-2 text-2xl font-bold">{group.short_title}</h4>
          <p className="mb-4 text-gray-400">{group.description}</p>

          <div
            role="toolbar"
            className="toolbar focus-ring-dark-neutral-normal-bgr mb-4 inline-flex -space-x-px rounded transition"
          >
            {billingCycles.map((cycle) => (
              <button
                key={cycle[0]}
                title={messages.billing_cycles.billed_every.replace(
                  "[cycle]",
                  cycle[0]
                )}
                type="button"
                className={`${billingCycle[0] === cycle[0] ? "billing-cycle-button-active" : "billing-cycle-button-inactive"}`}
                onClick={() => setBillingCycle(cycle)}
              >
                <span className="flex w-full items-center justify-center space-x-2 *:flex *:items-center *:justify-center">
                  <span>
                    <span className="hidden sm:block">
                      {
                        messages.billing_cycles[
                          cycle[0] as keyof typeof messages.billing_cycles
                        ]
                      }
                    </span>
                    <span className="sm:sr-only sm:hidden">{cycle[1]}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="inline-block min-w-full">
            <div className="plans-container">
              <div className="block sm:inline-flex">
                <div className="block pb-4 sm:inline-flex sm:space-x-4">
                  {group.plans.map((plan, idx) => {
                    // Pass the custom gradient colors to the function
                    const shortTitleGradient = getPlanGradient(
                      idx,
                      group.plans.length,
                      gradientStartColor,
                      gradientEndColor
                    )

                    const planCard = (
                      <div className="dark:bg-card-primary text-card-foreground bg-card mb-10 min-w-56 whitespace-nowrap rounded-lg border p-6 backdrop-blur-xs sm:mb-0">
                        {plan.recommended && (
                          <div className="mb-3 flex justify-center sm:-mt-16 sm:mb-8">
                            <SparklesText
                              text="Most Popular"
                              className="text-xl font-semibold"
                              sparklesCount={4}
                            />
                          </div>
                        )}
                        {/* 
                          Use bg-clip-text and text-transparent 
                          with an inline style for the gradient 
                        */}
                        <h5
                          className="mb-2 pb-2 text-xl font-semibold"
                          style={{
                            // The linear gradient "slice" we computed
                            background: shortTitleGradient,
                            // Let the background show through the text
                            WebkitBackgroundClip: "text",
                            // For Safari / iOS
                            WebkitTextFillColor: "transparent",
                            // Standard property for Firefox, etc.
                            backgroundClip: "text",
                            color: "transparent",
                          }}
                        >
                          {plan.short_title}
                        </h5>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">
                            {plan.storage_capacity}
                          </h5>
                          <span className="text-gray-400">
                            {plan.storage_type} {messages.card.storage}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">{plan.traffic}</h5>
                          <span className="text-gray-400">
                            {messages.card.traffic}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">
                            {plan.app_slots}
                          </h5>
                          <span className="text-gray-400">
                            {messages.card.app_slots}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">
                            {plan.connection_speed}
                          </h5>
                          <span className="text-gray-400">
                            {messages.card.connection_speed}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">
                            {plan.resources}
                          </h5>
                          <span className="text-gray-400">
                            {messages.card.resource_multiplier}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-xl font-bold">
                            {plan.users_per_disk}
                          </h5>
                          <span className="text-gray-400">
                            {messages.card.users_per_disk}
                          </span>
                        </div>
                        {plan.raid && (
                          <div className="mb-4">
                            <h5 className="text-xl font-bold">{plan.raid}</h5>
                            <span className="text-gray-400">
                              {messages.card.raid}
                            </span>
                          </div>
                        )}
                        {plan.number_of_disks !== undefined && (
                          <div className="mb-4">
                            <h5 className="text-xl font-bold">
                              {plan.number_of_disks}
                            </h5>
                            <span className="text-gray-400">
                              {messages.card.disks}
                            </span>
                          </div>
                        )}
                        <div className="mb-2 text-2xl font-extrabold text-white">
                          {plan.pricing.EUR[billingCycle[0]].per_month}
                          <small className="text-base font-medium text-gray-400">
                            {messages.card.per_month}
                          </small>
                        </div>
                        <div className="mb-4 text-xs text-gray-400">
                          {plan.pricing.EUR[billingCycle[0]].billed}{" "}
                          {
                            messages.billing_cycles[
                              billingCycle[0] as keyof typeof messages.billing_cycles
                            ]
                          }
                        </div>
                        <Button variant="pulse">
                          {messages.card.order_now}
                        </Button>
                      </div>
                    )

                    return plan.recommended ? (
                      <BackgroundGradient
                        key={idx}
                        containerClassName="p-1 mb-10 sm:mb-0"
                        className="-mb-10 rounded-lg bg-gray-950 sm:mb-0"
                      >
                        {planCard}
                      </BackgroundGradient>
                    ) : (
                      cloneElement(planCard, { key: idx })
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Plans
