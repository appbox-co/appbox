"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ApiError } from "@/api/client"
import { routing } from "@/i18n/routing"

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1]
}

function getLocaleAwarePath(path: string) {
  const localeFromPath = routing.locales.find(
    (locale) =>
      window.location.pathname === `/${locale}` ||
      window.location.pathname.startsWith(`/${locale}/`)
  )
  const locale = localeFromPath ?? readCookie("NEXT_LOCALE")

  if (!locale || locale === routing.defaultLocale) {
    return path
  }

  return `/${locale}${path}`
}

function isAuthSessionError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false
  }

  if (error.status === 401) {
    return true
  }

  return (
    error.status === 403 &&
    error.message.toLowerCase().includes("malformed auth token")
  )
}

function isBlacklistedTokenError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.message.toLowerCase().includes("malformed auth token")
  )
}

function clearLocalSession() {
  return fetch("/api/auth/logout?local=1", {
    method: "POST",
    credentials: "include",
    cache: "no-store"
  }).catch(() => {})
}

export function TanstackQueryProvider({
  children
}: {
  children: React.ReactNode
}) {
  // Track consecutive 401s to avoid redirect on a single transient failure
  const authFailCount = useRef(0)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAuthError = useCallback(() => {
    authFailCount.current += 1
    // Redirect after 2+ consecutive auth failures within a short window
    if (authFailCount.current >= 2 && !redirectTimer.current) {
      redirectTimer.current = setTimeout(() => {
        window.location.assign(getLocaleAwarePath("/login"))
      }, 500)
    }
  }, [])

  const handleDefinitiveAuthError = useCallback(() => {
    authFailCount.current = 2
    if (!redirectTimer.current) {
      redirectTimer.current = setTimeout(() => {
        window.location.assign(getLocaleAwarePath("/login"))
      }, 0)
    }
  }, [])

  const handleSuccess = useCallback(() => {
    // Reset auth fail counter on any successful request
    authFailCount.current = 0
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current)
      redirectTimer.current = null
    }
  }, [])

  const handleAuthErrorRef = useRef(handleAuthError)
  const handleSuccessRef = useRef(handleSuccess)
  useEffect(() => {
    handleAuthErrorRef.current = handleAuthError
    handleSuccessRef.current = handleSuccess
  }, [handleAuthError, handleSuccess])

  /* eslint-disable react-hooks/refs -- initializer stores callbacks that call ref.current when invoked (async), not during render */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isAuthSessionError(error)) {
              void clearLocalSession()
              if (isBlacklistedTokenError(error)) {
                handleDefinitiveAuthError()
              } else {
                handleAuthErrorRef.current()
              }
            }
          },
          onSuccess: () => {
            handleSuccessRef.current()
          }
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isAuthSessionError(error)) {
              void clearLocalSession()
              if (isBlacklistedTokenError(error)) {
                handleDefinitiveAuthError()
              } else {
                handleAuthError()
              }
            }
          }
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth/session failures or 404 (not found)
              if (
                isAuthSessionError(error) ||
                (error instanceof ApiError && error.status === 404)
              ) {
                return false
              }
              return failureCount < 1
            }
          }
        }
      })
  )
  /* eslint-enable react-hooks/refs */

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
