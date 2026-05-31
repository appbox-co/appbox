"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  changePassword,
  createApiKey,
  disable2FA,
  generate2FASecret,
  get2FAStatus,
  getAbuseReport,
  getAbuseReportFiles,
  getAbuseReports,
  getApiKeys,
  getProfile,
  regenerateRecoveryCodes,
  resolveAbuseReport,
  revokeApiKey,
  updateApiKey,
  updateProfile,
  verify2FA
} from "../account"
import type { CreateApiKeyInput, UpdateApiKeyInput } from "../account"

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useProfile(userId: number) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => getProfile(userId),
    enabled: userId > 0
  })
}

export function use2FAStatus(enabled = true) {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: get2FAStatus,
    enabled
  })
}

export function useAbuseReports() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.abuseReports.all,
    queryFn: () => getAbuseReports(user.id)
  })
}

export function useAbuseReport(id: number) {
  return useQuery({
    queryKey: queryKeys.abuseReports.detail(id),
    queryFn: () => getAbuseReport(id),
    enabled: id > 0
  })
}

export function useAbuseReportFiles(abuseId: number) {
  return useQuery({
    queryKey: [...queryKeys.abuseReports.detail(abuseId), "files"] as const,
    queryFn: () => getAbuseReportFiles(abuseId),
    enabled: abuseId > 0
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: queryKeys.apiKeys.all,
    queryFn: getApiKeys
  })
}

export function useResolveAbuseReport(abuseId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resolveAbuseReport(abuseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.abuseReports.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.abuseReports.detail(abuseId)
      })
    }
  })
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function useUpdateProfile(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { alias?: string }) => updateProfile(userId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.me, data)
    }
  })
}

export function useChangePassword(userId: number) {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      changePassword(userId, data)
  })
}

export function useGenerate2FA() {
  return useMutation({
    mutationFn: generate2FASecret
  })
}

export function useVerify2FA() {
  return useMutation({
    mutationFn: verify2FA
  })
}

export function useDisable2FA() {
  return useMutation({
    mutationFn: disable2FA
  })
}

export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateRecoveryCodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    }
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApiKeyInput) => createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
    }
  })
}

export function useUpdateApiKey(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateApiKeyInput) => updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
    }
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all })
    }
  })
}
