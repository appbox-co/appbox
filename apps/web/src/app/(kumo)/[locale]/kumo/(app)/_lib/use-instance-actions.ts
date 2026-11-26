"use client"

import {
  useFreezeApp,
  useRestartApp,
  useStartApp,
  useStopApp,
  useUnfreezeApp
} from "@/api/installed-apps/hooks/use-installed-apps"
import type { InstanceAction } from "../../_components/installed/instance-controls"

/** Runs a power action on one or more installs with the dashboard's own requests. */
export function useInstanceActions() {
  const mutations = {
    start: useStartApp(),
    stop: useStopApp(),
    restart: useRestartApp(),
    freeze: useFreezeApp(),
    unfreeze: useUnfreezeApp()
  }

  return (action: InstanceAction, ids: number[]) =>
    Promise.all(ids.map((id) => mutations[action].mutateAsync(id)))
}
