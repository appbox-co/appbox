"use client"

import { useRef, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Banner, Button, Dialog, Input, Label } from "@cloudflare/kumo"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { postReauth } from "@/api/account/reauth"
import { CodeInput } from "../ui/code-input"

const RECOVERY_CODE_LENGTH = 8

interface RecentAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the sign-in is accepted; the dialog closes when it settles. */
  onVerified: () => void | Promise<void>
  description?: string
  idPrefix?: string
}

/**
 * Asks for the password again (and a two-factor code, if the account uses
 * one) before a sensitive change. The steps and what is sent are the current
 * design's recent-auth-dialog.tsx, unchanged; only what it renders differs.
 */
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
      const result = await postReauth(
        twoFactorToken
          ? {
              code: code.trim(),
              two_factor_token: twoFactorToken,
              use_recovery: useRecovery
            }
          : { password }
      )
      if (!isCurrentSubmission(submissionId)) return

      if (!result.ok) {
        setError(
          typeof result.error === "string" ? result.error : t("reauthFailed")
        )
        return
      }

      if (result.two_factor_required) {
        setTwoFactorToken(result.two_factor_token ?? "")
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

  const codeLabel = useRecovery ? t("recoveryCode") : t("twoFactorCode")

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
    >
      <Dialog className="px-6 py-5">
        <form onSubmit={submitReauth} className="grid grid-cols-1 gap-5">
          <div className="grid gap-1.5">
            <Dialog.Title className="text-lg font-semibold">
              {t("reauthTitle")}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {twoFactorToken
                ? t("reauthTwoFactorDescription")
                : (description ?? t("reauthDescription"))}
            </Dialog.Description>
          </div>

          {twoFactorToken ? (
            <div className="grid justify-items-start gap-2">
              <Label htmlFor={`${idPrefix}-code`}>{codeLabel}</Label>
              {useRecovery ? (
                <CodeInput
                  key="recovery"
                  kind="recovery"
                  id={`${idPrefix}-code`}
                  label={codeLabel}
                  value={code}
                  onChange={(value) =>
                    setCode(
                      value
                        .replace(/[^A-Z0-9]/gi, "")
                        .toUpperCase()
                        .slice(0, RECOVERY_CODE_LENGTH)
                    )
                  }
                  disabled={isPending}
                  required
                  autoFocus
                />
              ) : (
                <CodeInput
                  key="totp"
                  id={`${idPrefix}-code`}
                  label={codeLabel}
                  value={code}
                  onChange={setCode}
                  disabled={isPending}
                  required
                  autoFocus
                />
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="-ms-2"
                onClick={() => {
                  setUseRecovery((current) => !current)
                  setCode("")
                }}
              >
                {useRecovery ? t("useAuthenticator") : t("useRecoveryCode")}
              </Button>
            </div>
          ) : (
            <Input
              id={`${idPrefix}-password`}
              type="password"
              label={t("password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              autoFocus
            />
          )}

          {error && (
            <Banner
              variant="error"
              icon={<WarningCircleIcon weight="fill" />}
              description={error}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              loading={isPending}
            >
              {twoFactorToken ? t("verify") : t("reauthSubmit")}
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  )
}
