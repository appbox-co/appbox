"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { useAuth } from "@/providers/auth-provider"
import {
  changePassword,
  disable2FA,
  generate2FASecret,
  get2FAStatus,
  getAbuseReport,
  getAbuseReportFiles,
  getAbuseReports,
  getProfile,
  regenerateRecoveryCodes,
  resolveAbuseReport,
  updateProfile,
  verify2FA
} from "../account"

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

export function use2FAStatus() {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: get2FAStatus
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verify2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me })
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    }
  })
}

export function useDisable2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me })
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] })
    }
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
