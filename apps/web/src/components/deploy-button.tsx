"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface DeployButtonProps {
  appId: string | number
  deployText: string
  dialogTitle: string
  dialogQuestion: string
  yesText: string
  noText: string
}

export default function DeployButton({
  appId,
  deployText,
  dialogTitle,
  dialogQuestion,
  yesText,
  noText
}: DeployButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleYes = () => {
    // Redirect to appbox with app ID
    window.location.href = `/appstore/app/${appId}`
    setIsOpen(false)
  }

  const handleNo = () => {
    router.push("/#plans-section")
    setIsOpen(false)
  }

  return (
    <>
      <Button className="w-full" size="lg" onClick={() => setIsOpen(true)}>
        {deployText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogQuestion}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between">
            <Button variant="outline" onClick={handleNo}>
              {noText}
            </Button>
            <Button onClick={handleYes}>{yesText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
