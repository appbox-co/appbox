"use client"

import { useState } from "react"
import {
  DeployDialog,
  type EligiblePlanOption
} from "@/components/marketing/deploy-dialog"
import { Button } from "@/components/ui/button"

interface DeployButtonProps {
  appId: string | number
  deployText: string
  dialogTitle: string
  dialogQuestion: string
  yesText: string
  noText: string
  eligiblePlans?: EligiblePlanOption[]
}

export default function DeployButton({
  appId,
  deployText,
  eligiblePlans
}: DeployButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button className="w-full" size="lg" onClick={() => setIsOpen(true)}>
        {deployText}
      </Button>

      <DeployDialog
        appId={appId}
        open={isOpen}
        onOpenChange={setIsOpen}
        eligiblePlans={eligiblePlans}
      />
    </>
  )
}
