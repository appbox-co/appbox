"use client"

import { FormEvent, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { ApiError } from "@/api/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ReauthResponse {
  error?: string
  two_factor_required?: boolean
  two_factor_token?: string
}

interface RecentAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void | Promise<void>
  description?: string
  idPrefix?: string
}

export function isRecentAuthError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("recent authentication is required") ||
    message.includes("recent user authentication is required") ||
    message.includes("auth: recent authentication required")
  )
}

export function RecentAuthDialog({
  open,
  onOpenChange,
  onVerified,
  description,
  idPrefix = "recent-auth"
}: RecentAuthDialogProps) {
  const t = useTranslations("account.apiKeys")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [useRecovery, setUseRecovery] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")
  const submissionIdRef = useRef(0)

  function reset() {
    submissionIdRef.current += 1
    setPassword("")
    setCode("")
    setUseRecovery(false)
    setTwoFactorToken("")
    setIsPending(false)
    setError("")
  }

  function isCurrentSubmission(submissionId: number) {
    return submissionId === submissionIdRef.current
  }

  function close() {
    reset()
    onOpenChange(false)
  }

  async function submitReauth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submissionId = submissionIdRef.current + 1
    submissionIdRef.current = submissionId
    setIsPending(true)
    setError("")

    try {
      const response = await fetch("/api/auth/reauth", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(
          twoFactorToken
            ? {
                code: code.trim(),
                two_factor_token: twoFactorToken,
                use_recovery: useRecovery
              }
            : { password }
        )
      })

      const data = (await response.json().catch(() => ({}))) as ReauthResponse
      if (!isCurrentSubmission(submissionId)) return

      if (!response.ok) {
        setError(
          typeof data.error === "string" ? data.error : t("reauthFailed")
        )
        return
      }

      if (data.two_factor_required) {
        setTwoFactorToken(data.two_factor_token ?? "")
        setCode("")
        return
      }

      await onVerified()
      if (!isCurrentSubmission(submissionId)) return

      reset()
      onOpenChange(false)
    } catch {
      if (!isCurrentSubmission(submissionId)) return
      setError(t("reauthFailed"))
    } finally {
      if (isCurrentSubmission(submissionId)) {
        setIsPending(false)
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <form onSubmit={submitReauth} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("reauthTitle")}</DialogTitle>
            <DialogDescription>
              {twoFactorToken
                ? t("reauthTwoFactorDescription")
                : (description ?? t("reauthDescription"))}
            </DialogDescription>
          </DialogHeader>

          {twoFactorToken ? (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-code`}>
                {useRecovery ? t("recoveryCode") : t("twoFactorCode")}
              </Label>
              <Input
                id={`${idPrefix}-code`}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
                inputMode={useRecovery ? "text" : "numeric"}
                maxLength={useRecovery ? 32 : 6}
                required
                autoFocus
              />
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  setUseRecovery((current) => !current)
                  setCode("")
                }}
              >
                {useRecovery ? t("useAuthenticator") : t("useRecoveryCode")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-password`}>{t("password")}</Label>
              <Input
                id={`${idPrefix}-password`}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {twoFactorToken ? t("verify") : t("reauthSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
