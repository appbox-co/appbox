"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import type { ControllerRenderProps, FieldValues } from "react-hook-form"
import { toast } from "sonner"
import type {
  CustomTableColumn,
  CustomTableDefinition,
  CustomTableRow
} from "@/api/custom-tables/custom-tables"
import { parseTableRef } from "@/api/custom-tables/custom-tables"
import {
  useAddCustomTableRow,
  useCustomTableRows,
  useDeleteCustomTableRow,
  useInstanceCustomTables,
  useUpdateCustomTableRow
} from "@/api/custom-tables/hooks/use-custom-tables"
import {
  DataTable,
  DataTableColumnHeader
} from "@/components/dashboard/data-table"
import { FormFieldRenderer } from "@/components/dashboard/dynamic-form/form-field-renderer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import type { FormFieldConfig } from "@/types/dashboard"

function isRequired(column: CustomTableColumn): boolean {
  const rules = column.inputField?.validate
  if (!Array.isArray(rules)) return false
  return rules.some((rule) => rule === "required")
}

function validateValue(
  column: CustomTableColumn,
  value: string
): string | null {
  const rules = column.inputField?.validate
  if (!Array.isArray(rules)) return null

  for (const rule of rules) {
    if (rule === "required" && value.trim() === "") return "required"
    if (rule === "alphanumeric" && value && !/^[a-zA-Z0-9]+$/.test(value)) {
      return "alphanumeric"
    }
    if (rule === "complexPassword" && value) {
      if (
        !/[a-z]/.test(value) ||
        !/[A-Z]/.test(value) ||
        !/[0-9]/.test(value) ||
        !/[^a-zA-Z0-9]/.test(value)
      ) {
        return "complexPassword"
      }
    }
  }
  return null
}

function toTextValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "1" : "0"
  return ""
}

function mapColumnToFormConfig(column: CustomTableColumn): FormFieldConfig {
  const type = column.inputField?.type ?? "dynamicText"
  const required = isRequired(column)
  const base = {
    name: column.name,
    label: column.title || column.name,
    required
  }

  if (type === "switch") return { ...base, type: "toggle" }

  if (type === "selector") {
    const menuItems =
      (column.inputField?.params?.menuItems as
        | Record<string, string>
        | undefined) ?? {}
    return {
      ...base,
      type: "select",
      options: Object.entries(menuItems).map(([value, label]) => ({
        value,
        label
      }))
    }
  }

  if (
    type === "password" ||
    type === "passwordAlphaNumeric" ||
    type === "complexPassword"
  ) {
    return { ...base, type: "password" }
  }

  if (type === "number") return { ...base, type: "number" }

  return { ...base, type: "text" }
}

function isExternalLinkColumn(column: CustomTableColumn): boolean {
  const fieldType = column.type ?? column.inputField?.type
  return fieldType === "externalURL" || fieldType === "clientURL"
}

function isDataColumn(column: CustomTableColumn): boolean {
  return (
    column.name.endsWith(":value") &&
    column.type !== "buttonAction" &&
    column.type !== "action"
  )
}

function CustomTableCard({ table }: { table: CustomTableDefinition }) {
  const t = useTranslations("appboxmanager.appDetail")
  const { tableId, instanceId } = parseTableRef(table.APIRoute)

  const { data: rows = [], isLoading } = useCustomTableRows(tableId, instanceId)
  const addMutation = useAddCustomTableRow(tableId, instanceId)
  const updateMutation = useUpdateCustomTableRow(tableId, instanceId)
  const deleteMutation = useDeleteCustomTableRow(tableId, instanceId)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CustomTableRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomTableRow | null>(null)
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({})
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const orderedColumns = useMemo(() => {
    const byName = new Map(table.columns.map((col) => [col.name, col]))
    return table.columnOrder
      .map((name) => byName.get(name))
      .filter((c): c is CustomTableColumn => Boolean(c))
  }, [table.columns, table.columnOrder])

  const dataColumns = useMemo(
    () => orderedColumns.filter((col) => isDataColumn(col)),
    [orderedColumns]
  )

  const inputDataColumns = useMemo(
    () => dataColumns.filter((col) => !isExternalLinkColumn(col)),
    [dataColumns]
  )

  const editableFieldSet = useMemo(
    () => new Set(table.editableFields ?? []),
    [table.editableFields]
  )

  const editableColumnsForEdit = useMemo(() => {
    const base = editableFieldSet.size === 0 ? dataColumns : dataColumns.filter((col) => editableFieldSet.has(col.name))
    return base.filter((col) => !isExternalLinkColumn(col))
  }, [dataColumns, editableFieldSet])

  const canAdd = table.enableAdding
  const canEdit = table.enableEditing && editableColumnsForEdit.length > 0
  const canDelete = table.enableDeleting
  const maxRows = table.maxRowShowAddButton
  const addDisabled = Boolean(maxRows && rows.length >= maxRows)

  const initializeForm = useCallback(
    (columns: CustomTableColumn[], row?: CustomTableRow | null) => {
      const next: Record<string, string> = {}
      for (const col of columns) {
        const value =
          row?.[col.name] ?? col.inputField?.defaultValue ?? col.defaultValue
        next[col.name] = toTextValue(value)
      }
      setFormValues(next)
      setFormErrors({})
    },
    [setFormValues, setFormErrors]
  )

  const openAdd = () => {
    initializeForm(inputDataColumns, null)
    setAddOpen(true)
  }

  const openEdit = useCallback(
    (row: CustomTableRow) => {
      initializeForm(editableColumnsForEdit, row)
      setEditTarget(row)
    },
    [editableColumnsForEdit, initializeForm, setEditTarget]
  )

  const validateForm = (columns: CustomTableColumn[]): boolean => {
    const nextErrors: Record<string, string> = {}
    for (const col of columns) {
      const code = validateValue(col, formValues[col.name] ?? "")
      if (!code) continue

      if (code === "required")
        nextErrors[col.name] = t("customTablesValidationRequired")
      else if (code === "alphanumeric") {
        nextErrors[col.name] = t("customTablesValidationAlphanumeric")
      } else if (code === "complexPassword") {
        nextErrors[col.name] = t("customTablesValidationComplexPassword")
      }
    }
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm(inputDataColumns)) return
    try {
      await addMutation.mutateAsync(formValues)
      setAddOpen(false)
      toast.success(t("customTablesAddSuccess"))
    } catch {
      toast.error(t("customTablesAddFailed"))
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!validateForm(editableColumnsForEdit)) return
    try {
      await updateMutation.mutateAsync({
        rowId: editTarget.id,
        payload: formValues
      })
      setEditTarget(null)
      toast.success(t("customTablesEditSuccess"))
    } catch {
      toast.error(t("customTablesEditFailed"))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      toast.success(t("customTablesDeleteSuccess"))
    } catch {
      toast.error(t("customTablesDeleteFailed"))
    }
  }

  const togglePasswordVisibility = (
    rowId: number | string,
    columnName: string
  ) => {
    const key = `${rowId}:${columnName}`
    setRevealedPasswords((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const tableColumns = useMemo<ColumnDef<CustomTableRow>[]>(() => {
    const cols: ColumnDef<CustomTableRow>[] = orderedColumns
      .filter((column) => column.type !== "hidden")
      .map((column) => ({
        id: column.name,
        accessorFn: (row) => toTextValue(row[column.name]),
        header: ({ column: col }) => (
          <DataTableColumnHeader
            column={col}
            title={column.title || column.name}
          />
        ),
        cell: ({ row }) => {
          const rawValue = row.original[column.name]
          const value = toTextValue(rawValue)
          const fieldType = column.type ?? column.inputField?.type

          if (fieldType === "switch" || fieldType === "IsEnabledCell") {
            const enabled = value === "1" || value.toLowerCase() === "true"
            return (
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? t("customTablesEnabled") : t("customTablesDisabled")}
              </Badge>
            )
          }

          if (
            fieldType === "password" ||
            fieldType === "passwordAlphaNumeric" ||
            fieldType === "complexPassword"
          ) {
            const passwordKey = `${row.original.id}:${column.name}`
            const isRevealed = Boolean(revealedPasswords[passwordKey])
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {isRevealed ? value || "—" : "••••••••"}
                </span>
                {value ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() =>
                      togglePasswordVisibility(row.original.id, column.name)
                    }
                  >
                    {isRevealed ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                ) : null}
              </div>
            )
          }

          if (
            (fieldType === "externalURL" || fieldType === "clientURL") &&
            value.trim() !== ""
          ) {
            const href = /^https?:\/\//i.test(value)
              ? value
              : `https://${value}`
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-4"
              >
                {value}
              </a>
            )
          }

          return <span className="text-sm">{value || "—"}</span>
        }
      }))

    if (canEdit || canDelete) {
      cols.push({
        id: "actions",
        header: t("customTablesActions"),
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => openEdit(row.original)}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )
      })
    }

    return cols
  }, [
    orderedColumns,
    canEdit,
    canDelete,
    t,
    revealedPasswords,
    openEdit,
    setDeleteTarget
  ])

  const searchColumn = orderedColumns.find((col) => isDataColumn(col))

  const renderFormFields = (columns: CustomTableColumn[]) => {
    return columns.map((col) => {
      const config = mapColumnToFormConfig(col)
      const field = {
        name: col.name,
        value: formValues[col.name] ?? "",
        onBlur: () => undefined,
        ref: () => undefined,
        onChange: (
          next:
            | string
            | number
            | boolean
            | { target?: { value?: unknown } }
            | undefined
        ) => {
          if (typeof next === "string" || typeof next === "number") {
            setFormValues((prev) => ({ ...prev, [col.name]: String(next) }))
            return
          }
          if (typeof next === "boolean") {
            setFormValues((prev) => ({ ...prev, [col.name]: next ? "1" : "0" }))
            return
          }
          const targetValue = next?.target?.value
          if (
            typeof targetValue === "string" ||
            typeof targetValue === "number"
          ) {
            setFormValues((prev) => ({
              ...prev,
              [col.name]: String(targetValue)
            }))
            return
          }
          setFormValues((prev) => ({ ...prev, [col.name]: "" }))
        }
      } as unknown as ControllerRenderProps<FieldValues, string>

      return (
        <FormFieldRenderer
          key={col.name}
          config={config}
          field={field}
          error={formErrors[col.name]}
        />
      )
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{table.label}</CardTitle>
              {table.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {table.description}
                </p>
              )}
              {maxRows ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("customTablesRowsUsage", {
                    current: rows.length,
                    max: maxRows
                  })}
                </p>
              ) : null}
            </div>
            {canAdd && (
              <Button size="sm" onClick={openAdd} disabled={addDisabled}>
                <Plus className="mr-1.5 size-4" />
                {t("customTablesAdd")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tableColumns}
            data={rows}
            isLoading={isLoading}
            searchKey={searchColumn?.name}
            searchPlaceholder={t("customTablesSearch", { label: table.label })}
            emptyMessage={t("customTablesEmpty")}
            pageSize={Math.max(10, Math.min(maxRows ?? 25, 50))}
          />
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setFormErrors({})
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("customTablesAddTitle", { label: table.label })}
            </DialogTitle>
            <DialogDescription>
              {t("customTablesAddDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">{renderFormFields(inputDataColumns)}</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={addMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("customTablesSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
          setFormErrors({})
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("customTablesEditTitle", { label: table.label })}
            </DialogTitle>
            <DialogDescription>
              {t("customTablesEditDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {renderFormFields(editableColumnsForEdit)}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={updateMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("customTablesUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customTablesDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("customTablesDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {t("customTablesDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CustomTablesCard({ appId }: { appId: number }) {
  const t = useTranslations("appboxmanager.appDetail")
  const { data: tables = [], isLoading } = useInstanceCustomTables(appId)

  if (!isLoading && tables.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("customTablesTitle")}</h2>
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("customTablesLoading")}
            </div>
          </CardContent>
        </Card>
      ) : (
        tables.map((table) => (
          <CustomTableCard key={`${appId}-${table.APIRoute}`} table={table} />
        ))
      )}
    </div>
  )
}
