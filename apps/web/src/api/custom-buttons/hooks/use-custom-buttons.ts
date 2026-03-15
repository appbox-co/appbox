"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import {
  getCustomButtons,
  triggerCustomButton,
  type CustomButton
} from "../custom-buttons"

export function useCustomButtons(instanceId: number) {
  return useQuery({
    queryKey: queryKeys.customButtons.byInstance(instanceId),
    queryFn: () => getCustomButtons(instanceId),
    enabled: instanceId > 0,
    staleTime: 5 * 60 * 1000 // buttons rarely change — cache for 5 min
  })
}

export function useTriggerCustomButton() {
  return useMutation({
    mutationFn: ({
      button,
      payload
    }: {
      button: CustomButton
      payload?: Record<string, unknown>
    }) => triggerCustomButton(button, payload)
  })
}
