"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { getOAuthGrants, revokeOAuthGrant } from "../oauth"

// The consent page deliberately has no hooks here. See getOAuthConsentRequest.

export function useOAuthGrants() {
  return useQuery({
    queryKey: queryKeys.oauthGrants.all,
    queryFn: getOAuthGrants
  })
}

export function useRevokeOAuthGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => revokeOAuthGrant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.oauthGrants.all })
    }
  })
}
