"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  validateInstallApp,
  type InstallValidationResult
} from "@/api/apps/app-store"
import { createInstallValidationSession } from "@/lib/install-validation"

interface State {
  key: string
  pending: boolean
  result?: InstallValidationResult
  error?: string
}

export function useInstallValidation(
  payload: Record<string, unknown>,
  enabled: boolean
) {
  const key = JSON.stringify(payload)
  const session = useMemo(() => createInstallValidationSession(), [])
  const [state, setState] = useState<State | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const validate = useCallback(async () => {
    if (!enabled) return null
    if (timer.current) clearTimeout(timer.current)
    setState({ key, pending: true })
    try {
      const result = await session.run(() =>
        validateInstallApp(JSON.parse(key))
      )
      if (result) setState({ key, pending: false, result })
      return result
    } catch {
      setState({
        key,
        pending: false,
        error:
          "Unable to validate the installation right now. Please try again."
      })
      return null
    }
  }, [enabled, key, session])

  useLayoutEffect(() => {
    session.invalidate()
    if (!enabled) return
    timer.current = setTimeout(() => {
      void validate()
    }, 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      session.invalidate()
    }
  }, [enabled, key, session, validate])

  const current = enabled && state?.key === key ? state : null
  return {
    validate,
    pending: current?.pending ?? false,
    fieldErrors: current?.result?.fieldErrors ?? {},
    error: current?.error ?? current?.result?.fieldErrors._form?.message,
    // Network failures remain retryable by pressing Install; it always preflights again.
    invalid: current?.result?.valid === false
  }
}
