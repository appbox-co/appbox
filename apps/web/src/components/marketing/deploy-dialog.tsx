"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface EligiblePlanOption {
  productId: number
  title: string
  appSlots: number
  monthlyPrice?: string
  storage?: string
  storageType?: string
  connectionSpeed?: string
}

interface DeployDialogProps {
  appId: number | string
  open: boolean
  onOpenChange: (open: boolean) => void
  eligiblePlans?: EligiblePlanOption[]
}

function getPlanOrderUrl(plan: EligiblePlanOption) {
  return `https://billing.appbox.co/order.php?spage=product&a=add&pid=${plan.productId}&billingcycle=monthly`
}

function cleanupModalSideEffects() {
  document.body.style.removeProperty("pointer-events")
  document.body.style.removeProperty("overflow")
  document.body.style.removeProperty("padding-right")
  document.body.removeAttribute("data-scroll-locked")
}

function PlanRow({
  plan,
  loading,
  className
}: {
  plan: EligiblePlanOption
  loading?: boolean
  className?: string
}) {
  return (
    <div
      data-slot="plan-row"
      className={cn(
        "flex w-full items-center justify-between gap-4 py-1",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium">{plan.title}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{plan.appSlots} App Slots</span>
          {plan.storage && (
            <span>
              {plan.storage}
              {plan.storageType ? ` ${plan.storageType}` : ""}
            </span>
          )}
          {plan.connectionSpeed && <span>{plan.connectionSpeed}</span>}
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {loading && <Loader2 className="size-3 animate-spin" />}
        {loading
          ? "Loading..."
          : plan.monthlyPrice && `${plan.monthlyPrice}/mo`}
      </span>
    </div>
  )
}

export function DeployDialog({
  appId,
  open,
  onOpenChange,
  eligiblePlans = []
}: DeployDialogProps) {
  const router = useRouter()
  const t = useTranslations("apps.detail.deploy_dialog")
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const closeDialog = () => {
    setSelectedPlanId("")
    setLoadingPlanId(null)
    onOpenChange(false)
    cleanupModalSideEffects()
  }

  const handleSelectPlan = (productId: string) => {
    setSelectedPlanId(productId)
    const plan = eligiblePlans.find(
      (candidate) => String(candidate.productId) === productId
    )
    if (plan) {
      setLoadingPlanId(productId)
      window.open(getPlanOrderUrl(plan), "_blank", "noopener,noreferrer")
      closeDialog()
    }
  }

  const handleExistingAppbox = () => {
    closeDialog()
    router.push(`/appstore/app/${appId}?install=1`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("question")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("planLabel")}</label>
          {eligiblePlans.length > 0 ? (
            <Select value={selectedPlanId} onValueChange={handleSelectPlan}>
              <SelectTrigger className="h-14 py-0 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:justify-center [&>span]:line-clamp-none [&>span]:text-center">
                <SelectValue placeholder={t("planPlaceholder")}>
                  {selectedPlanId
                    ? (() => {
                        const plan = eligiblePlans.find(
                          (candidate) =>
                            String(candidate.productId) === selectedPlanId
                        )
                        return plan ? (
                          <PlanRow
                            plan={plan}
                            loading={loadingPlanId === selectedPlanId}
                            className="pr-2"
                          />
                        ) : undefined
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-(--radix-select-trigger-width)">
                {eligiblePlans.map((plan) => (
                  <SelectItem
                    key={plan.productId}
                    value={String(plan.productId)}
                    className="min-h-16 cursor-pointer py-2 pl-3 pr-9 data-[state=checked]:bg-primary/10 data-[state=checked]:text-foreground [&>span:first-child]:right-3 [&>span:last-child]:w-full **:data-[slot=plan-row]:w-full"
                  >
                    <PlanRow
                      plan={plan}
                      loading={loadingPlanId === String(plan.productId)}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t("noEligiblePlans")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("planHelp")}</p>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={handleExistingAppbox}>
            {t("no")}
          </Button>
          {eligiblePlans.length === 0 && (
            <Button onClick={() => (window.location.href = "/#plans-section")}>
              {t("viewAllPlans")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
