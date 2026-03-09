"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, FileWarning } from "lucide-react"
import type { AbuseReport } from "@/api/account/account"
import { useAbuseReports } from "@/api/account/hooks/use-account"
import {
  DataTable,
  DataTableColumnHeader,
  DateCell
} from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Status badge styles (by backend statusCode)                                */
/* -------------------------------------------------------------------------- */

const statusCodeStyles: Record<number, string> = {
  [-1]: "border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-400",
  0: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  1: "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  2: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  3: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  4: "border-slate-500/25 bg-slate-500/15 text-slate-700 dark:text-slate-400",
  5: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  6: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  7: "border-cyan-500/25 bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  8: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  9: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  10: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  11: "border-orange-500/25 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  12: "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
}

const defaultStatusStyle =
  "border-zinc-500/25 bg-zinc-500/15 text-zinc-700 dark:text-zinc-400"

function AbuseStatusBadge({
  status,
  statusCode
}: {
  status: string
  statusCode: number
}) {
  const style =
    statusCodeStyles[statusCode] ??
    (status.toLowerCase().includes("waiting")
      ? statusCodeStyles[1]
      : defaultStatusStyle)

  return (
    <Badge variant="outline" className={cn("font-medium", style)}>
      {status}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function AbuseReportsPage() {
  const t = useTranslations("account")
  const router = useRouter()
  const { data, isLoading, error } = useAbuseReports()

  const columns = useMemo<ColumnDef<AbuseReport>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("abuse.id")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            #{row.original.isp_id ?? row.original.id}
          </span>
        ),
        size: 100
      },
      {
        accessorKey: "cyloname",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Appbox" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.cyloname ?? "—"}
          </span>
        ),
        size: 120
      },
      {
        accessorKey: "subject",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("abuse.subject")} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.subject}</span>
        )
      },
      {
        accessorKey: "complainant",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("abuse.complainant")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.complainant || "—"}
          </span>
        ),
        size: 140
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("abuse.status")} />
        ),
        cell: ({ row }) => (
          <AbuseStatusBadge
            status={row.original.status}
            statusCode={row.original.statusCode}
          />
        ),
        size: 180
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("abuse.date")} />
        ),
        cell: ({ row }) => <DateCell date={row.original.created_at} />,
        size: 140
      }
    ],
    [t]
  )

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("abuse.title")}
        </h1>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load abuse reports. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileWarning className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">
          {t("abuse.title")}
        </h1>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchKey="subject"
        searchPlaceholder="Search reports..."
        emptyMessage={t("abuse.noReports")}
        onRowClick={(row) => router.push(ROUTES.ABUSE_REPORT_DETAIL(row.id))}
      />
    </div>
  )
}
