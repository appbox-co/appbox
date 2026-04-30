"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import { usePortAssignments } from "@/api/installed-apps/hooks/use-port-assignments"
import type { PortAssignment } from "@/api/installed-apps/port-assignments"
import { DataTable } from "@/components/dashboard/data-table/data-table"
import { DataTableColumnHeader } from "@/components/dashboard/data-table/data-table-column-header"

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface PortAssignmentsTabProps {
  serverName: string
  instanceId: number
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PortAssignmentsTab({
  serverName,
  instanceId
}: PortAssignmentsTabProps) {
  const t = useTranslations("appboxmanager.appDetail")
  const { data: ports = [], isLoading } = usePortAssignments(
    serverName,
    instanceId
  )

  const columns = useMemo<ColumnDef<PortAssignment>[]>(
    () => [
      {
        accessorKey: "internal_ip",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("internalIp")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("internal_ip") ?? "—"}
          </span>
        )
      },
      {
        accessorKey: "host_ip",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("hostIp")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("host_ip") ?? "—"}
          </span>
        )
      },
      {
        accessorKey: "internal_port",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("internalPort")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("internal_port")}
          </span>
        )
      },
      {
        accessorKey: "host_port",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("hostPort")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("host_port")}</span>
        )
      },
      {
        accessorKey: "protocol",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("protocol")} />
        ),
        cell: ({ row }) => {
          const val = row.getValue<string | null>("protocol")
          return <span className="uppercase text-xs">{val ?? "—"}</span>
        }
      }
    ],
    [t]
  )

  return (
    <DataTable
      columns={columns}
      data={ports}
      isLoading={isLoading}
      emptyMessage={t("noPortAssignments")}
      globalSearch
      searchPlaceholder={t("searchPorts")}
      pageSize={25}
      className="min-w-0"
    />
  )
}
