"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge, cn, LayerCard, LinkButton, Tabs } from "@cloudflare/kumo"
import { CaretRightIcon } from "@phosphor-icons/react"
import type { PlansData } from "@/components/ui/plans"
import { spaced } from "./catalogue"

type Group = PlansData["data"][number]
type Plan = Group["plans"][number]
type Cycle = "monthly" | "quarterly" | "semiannually" | "annually"

const CYCLES: { value: Cycle; label: string; every?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly", every: "3 months" },
  { value: "semiannually", label: "Semiannually", every: "6 months" },
  { value: "annually", label: "Annually", every: "year" }
]

const BILLING = "https://billing.appbox.co"

/** The smallest shared plan that runs Windows VPS; dedicated plans all do. */
const WINDOWS_TIER = 18000

/** The current page's rule, copied from components/ui/plans.tsx. */
function supportsWindowsVps(plan: Plan, group: Group) {
  const descriptor =
    `${group.slug} ${group.title} ${group.short_title}`.toLowerCase()
  if (descriptor.includes("dedicated")) return true
  const tier = `${plan.short_title} ${plan.title}`.match(/NG[-\s]?(\d+)/i)
  return tier !== null && Number.parseInt(tier[1], 10) >= WINDOWS_TIER
}

function withAffiliate(url: string, affiliateId?: string) {
  if (!affiliateId) return url
  const target = new URL(url)
  target.searchParams.set("aff", affiliateId)
  return target.toString()
}

function Spec({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-kumo-subtle">{label}</dt>
      <dd className="min-w-0 text-end font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function PlanCard({
  plan,
  group,
  cycle,
  affiliateId,
  boostEnabled,
  showTraffic
}: {
  plan: Plan
  group: Group
  cycle: Cycle
  affiliateId?: string
  boostEnabled: boolean
  showTraffic: boolean
}) {
  const price = plan.pricing.EUR[cycle]
  const promotion =
    plan.promotion?.active && plan.promotion.applies_to.includes(cycle)
      ? plan.promotion
      : undefined
  const promoPrice = promotion?.promotional_pricing.EUR[cycle]
  const promoMonths = promotion?.duration_months ?? 1
  const every = CYCLES.find((entry) => entry.value === cycle)?.every
  const available = plan.available !== false
  const orderUrl = withAffiliate(
    available
      ? `${BILLING}/order.php?spage=product&a=add&pid=${plan.product_id}&billingcycle=${cycle}${
          promotion?.auto_apply && promotion.promo_code
            ? `&promocode=${promotion.promo_code}`
            : ""
        }`
      : `${BILLING}/contact.php`,
    affiliateId
  )
  const excluded = Object.values(plan.excluded_app_categories ?? {})

  return (
    <LayerCard className={cn("ks-plan", plan.recommended && "ks-popular")}>
      <LayerCard.Secondary className="justify-between">
        <span className="font-mono font-semibold text-kumo-default">
          {plan.short_title}
        </span>
        {plan.recommended ? (
          <Badge variant="primary">Most popular</Badge>
        ) : promotion ? (
          <Badge variant="success">Save {promotion.discount_percentage}%</Badge>
        ) : null}
      </LayerCard.Secondary>
      <LayerCard.Primary className="gap-3 px-5 py-4">
        <div className="grid gap-0.5">
          {promoPrice ? (
            <>
              <strong className="text-[26px] leading-tight font-semibold tabular-nums">
                {promoPrice.discounted_per_month}{" "}
                <small className="text-base font-normal text-kumo-subtle">
                  {promoMonths === 1
                    ? "first month"
                    : `for ${promoMonths} months`}
                </small>
              </strong>
              <span className="text-sm text-kumo-subtle">
                then {price.per_month} a month
              </span>
            </>
          ) : (
            <>
              <strong className="text-[26px] leading-tight font-semibold tabular-nums">
                {price.per_month}{" "}
                <small className="text-base font-normal text-kumo-subtle">
                  a month
                </small>
              </strong>
              <span className="text-sm text-kumo-subtle">
                {every ? `${price.billed} every ${every}` : "Billed monthly"}
              </span>
            </>
          )}
        </div>
        <dl className="-my-1 divide-y divide-kumo-hairline">
          <Spec label="Storage">
            {spaced(plan.storage_capacity)} {plan.storage_type}
          </Spec>
          {showTraffic && <Spec label="Traffic">{plan.traffic}</Spec>}
          <Spec label="App slots">{plan.app_slots}</Spec>
          <Spec label="Connection">{spaced(plan.connection_speed)}</Spec>
          {boostEnabled && <Spec label="App Boost">Included</Spec>}
          <Spec label="Windows VPS">
            {supportsWindowsVps(plan, group)
              ? "Supported"
              : `NG-${WINDOWS_TIER} and up`}
          </Spec>
          {plan.raid && <Spec label="RAID">{plan.raid}</Spec>}
          {plan.number_of_disks ? (
            <Spec label="Disks">{plan.number_of_disks}</Spec>
          ) : null}
        </dl>
        {excluded.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-kumo-hairline pt-2 text-xs text-kumo-subtle">
            <span className="w-full">Not included</span>
            {excluded.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        )}
        {available ? (
          <LinkButton
            href={orderUrl}
            variant="primary"
            className="mt-auto w-full justify-center"
            external
          >
            Order now
          </LinkButton>
        ) : (
          <LinkButton
            href={orderUrl}
            variant="secondary"
            className="mt-auto w-full justify-center"
            external
          >
            Contact us
          </LinkButton>
        )}
      </LayerCard.Primary>
    </LayerCard>
  )
}

/** One plan group: its own billing cycle and a row of cards that scrolls sideways. */
function PlanGroup({
  group,
  affiliateId,
  boostEnabled,
  showTraffic
}: {
  group: Group
  affiliateId?: string
  boostEnabled: boolean
  showTraffic: boolean
}) {
  const [cycle, setCycle] = useState<Cycle>("monthly")
  const [more, setMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const update = useCallback(() => {
    const scroll = scrollRef.current
    if (!scroll) return
    const max = scroll.scrollWidth - scroll.clientWidth
    // Right to left, scrollLeft runs from 0 down to -max.
    setMore(max > 1 && Math.abs(scroll.scrollLeft) < max - 1)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [update, cycle])

  const plans = [...group.plans].sort((a, b) => a.sort - b.sort)

  return (
    <div className="ks-group">
      <div className="ks-group-head">
        <div>
          <h3 className="text-lg font-semibold">
            {group.title.replace(/ Pricing$/, "")}
          </h3>
          <p className="mt-1 text-kumo-subtle">{group.description}</p>
        </div>
        <Tabs
          variant="segmented"
          tabs={CYCLES.map(({ value, label }) => ({ value, label }))}
          value={cycle}
          onValueChange={(value) => setCycle(value as Cycle)}
        />
      </div>
      <div className="ks-scrollwrap">
        <div
          ref={scrollRef}
          className={cn("ks-scroll", more && "ks-fade-end")}
          onScroll={update}
        >
          <div className="ks-cards">
            {plans.map((plan) => (
              <PlanCard
                key={plan.product_id}
                plan={plan}
                group={group}
                cycle={cycle}
                affiliateId={affiliateId}
                boostEnabled={boostEnabled}
                showTraffic={showTraffic}
              />
            ))}
          </div>
        </div>
        <span className={cn("ks-arrow", more && "ks-on")} aria-hidden="true">
          <CaretRightIcon size={40} />
        </span>
      </div>
    </div>
  )
}

/** Every plan group from the billing feed, in the feed's order, as on the current page. */
export function Plans({
  plans,
  affiliateId,
  boostEnabled,
  showTraffic
}: {
  plans: PlansData
  affiliateId?: string
  boostEnabled: boolean
  /** Off when the section heading already says traffic is unmetered. */
  showTraffic: boolean
}) {
  return (
    <>
      {plans.data.map((group) => (
        <PlanGroup
          key={group.slug}
          group={group}
          affiliateId={affiliateId}
          boostEnabled={boostEnabled}
          showTraffic={showTraffic}
        />
      ))}
    </>
  )
}
