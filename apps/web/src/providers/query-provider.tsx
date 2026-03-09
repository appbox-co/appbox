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
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }, 500)
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
            if (error instanceof ApiError && error.status === 401) {
              handleAuthErrorRef.current()
            }
          },
          onSuccess: () => {
            handleSuccessRef.current()
          }
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
              handleAuthError()
            }
          }
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 401 (auth) or 404 (not found)
              if (
                error instanceof ApiError &&
                (error.status === 401 || error.status === 404)
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
