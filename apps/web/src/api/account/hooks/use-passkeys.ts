"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  addPasskey,
  deletePasskey,
  getPasskeys,
  renamePasskey,
  type CreatePasskeyCredential,
  type Passkey
} from "../passkeys"

export function usePasskeys() {
  return useQuery({
    queryKey: queryKeys.passkeys.all,
    queryFn: getPasskeys
  })
}

/*
 * Each change updates the cached list with the API's answer, so the list is
 * not fetched again after it.
 */

/** Takes the browser's part of making the passkey (see `addPasskey`). */
export function useAddPasskey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (createCredential: CreatePasskeyCredential) =>
      addPasskey(createCredential),
    onSuccess: (passkey) => {
      queryClient.setQueryData<Passkey[]>(queryKeys.passkeys.all, (current) => [
        passkey,
        ...(current ?? [])
      ])
    }
  })
}

export function useRenamePasskey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      renamePasskey(id, name),
    onSuccess: (updated) => {
      queryClient.setQueryData<Passkey[]>(queryKeys.passkeys.all, (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item))
      )
    }
  })
}

export function useDeletePasskey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePasskey(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Passkey[]>(queryKeys.passkeys.all, (current) =>
        current?.filter((item) => item.id !== id)
      )
    }
  })
}
