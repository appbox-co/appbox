import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { getPortAssignments } from "../port-assignments"

export function usePortAssignments(serverName: string, instanceId: number) {
  return useQuery({
    queryKey: queryKeys.installedApps.ports(instanceId),
    queryFn: () => getPortAssignments(serverName, instanceId),
    enabled: !!serverName && instanceId > 0
  })
}
