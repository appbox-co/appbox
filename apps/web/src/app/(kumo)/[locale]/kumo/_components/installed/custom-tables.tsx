"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Button,
  Empty,
  Input,
  InputGroup,
  Pagination,
  SkeletonLine,
  Table,
  Tooltip
} from "@cloudflare/kumo"
import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlayIcon,
  PlusIcon,
  RowsIcon,
  TrashIcon,
  XIcon
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type {
  CustomTableColumn,
  CustomTableDefinition,
  CustomTableRow,
  CustomTableRowAction
} from "@/api/custom-tables/custom-tables"
import {
  isDuplicateCustomTableValueError,
  parseTableRef
} from "@/api/custom-tables/custom-tables"
import {
  useAddCustomTableRow,
  useCustomTableMutations,
  useCustomTableRowAction,
  useCustomTableRows,
  useDeleteCustomTableRow,
  useInstanceCustomTables,
  useRetryCustomTableMutation,
  useRevealCustomTableRowField,
  useUpdateCustomTableRow
} from "@/api/custom-tables/hooks/use-custom-tables"
import { customTableMutationRowLabel } from "@/api/custom-tables/mutation-notices"
import { createIdempotencyKey } from "@/api/idempotency"
import { clearHiddenFieldValues, isFieldVisible } from "@/lib/dynamic-form"
import { LoadingRow } from "../install/field-parts"
import { Panel } from "../panel"
import { EMPTY_IN_CARD } from "../shared"
import { nextSort, SortHead, type SortState } from "../sort-head"
import { CustomTableField, type FieldChange } from "./custom-tables-field"
import {
  compareRows,
  initialPageSize,
  isDataColumn,
  isExternalLinkColumn,
  isMutationAdmission,
  isRevealableColumn,
  isSensitiveColumn,
  mapColumnToFormConfig,
  matchesSearch,
  pageSizeOptions,
  REDACTED_SECRET_VALUE,
  shouldPreserveRedactedSensitiveValue,
  toTextValue,
  validateValue
} from "./custom-tables-logic"
import {
  ColumnsMenu,
  ConfirmDialog,
  EnabledBadge,
  FailedHistory,
  FormDialog,
  MutationNotices,
  RowsUsage,
  SecretValue
} from "./custom-tables-parts"

/** Text that stays in English, as it does in the current design. */
const COPY = {
  clearSearch: "Clear search"
} as const

const SECRET_MASK = "••••••••"

/**
 * The last value that was not null. A dialog that is closing keeps showing
 * what it was opened for while it animates out, instead of going blank.
 */
function useLastValue<T>(value: T | null): T | null {
  const [last, setLast] = useState(value)
  if (value !== null && value !== last) setLast(value)
  return value ?? last
}

/* -------------------------------------------------------------------------- */
/*  One table                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One of the app's tables: its rows, searchable, sortable and paged, with the
 * buttons to add, edit and delete a row, reveal a secret, and run the table's
 * own row actions. State, requests and validation are the current design's.
 */
function CustomTablePanel({ table }: { table: CustomTableDefinition }) {
  const t = useTranslations("appboxmanager.appDetail")
  const { tableId, instanceId } = parseTableRef(table.APIRoute)

  const { data: rows = [], isLoading } = useCustomTableRows(tableId, instanceId)
  const { data: tableMutations = [], isSuccess: mutationsLoaded } =
    useCustomTableMutations(
      tableId,
      instanceId,
      table.supportsRowMutations === true
    )
  const retryMutation = useRetryCustomTableMutation(tableId, instanceId)
  const addMutation = useAddCustomTableRow(tableId, instanceId)
  const updateMutation = useUpdateCustomTableRow(tableId, instanceId)
  const deleteMutation = useDeleteCustomTableRow(tableId, instanceId)
  const revealMutation = useRevealCustomTableRowField(tableId, instanceId)
  const rowActionMutation = useCustomTableRowAction(tableId, instanceId)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CustomTableRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomTableRow | null>(null)
  const [actionTarget, setActionTarget] = useState<{
    action: CustomTableRowAction
    row: CustomTableRow
  } | null>(null)
  const [actionConfirmation, setActionConfirmation] = useState("")
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({})
  const [revealedPasswordValues, setRevealedPasswordValues] = useState<
    Record<string, string>
  >({})
  const [revealingPasswordKey, setRevealingPasswordKey] = useState<
    string | null
  >(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const addIdempotencyKey = useRef<string | null>(null)
  const editIdempotencyKey = useRef<string | null>(null)
  const seenFailureIds = useRef<Set<number> | null>(null)

  // Counts form openings, so each one starts with fresh controls: a select
  // takes its value once, and a password field forgets it was shown.
  const [formSession, setFormSession] = useState(0)

  // What the current design keeps in its shared DataTable.
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState<string>>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(() =>
    initialPageSize(table.maxRowShowAddButton)
  )
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<string>>(
    new Set()
  )

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

  const rowActions = useMemo(() => {
    if (table.rowActions?.length) return table.rowActions
    return orderedColumns
      .map((column) => column.rowAction)
      .filter((action): action is CustomTableRowAction => Boolean(action))
  }, [orderedColumns, table.rowActions])

  const editableFieldSet = useMemo(
    () => new Set(table.editableFields ?? []),
    [table.editableFields]
  )

  const editableColumnsForEdit = useMemo(() => {
    const base =
      editableFieldSet.size === 0
        ? dataColumns
        : dataColumns.filter((col) => editableFieldSet.has(col.name))
    return base.filter((col) => !isExternalLinkColumn(col))
  }, [dataColumns, editableFieldSet])

  const canAdd = table.enableAdding
  const canEdit = table.enableEditing && editableColumnsForEdit.length > 0
  const canDelete = table.enableDeleting
  const maxRows = table.maxRowShowAddButton
  const activeMutations = useMemo(
    () =>
      tableMutations.filter((mutation) =>
        ["admission_pending", "queued", "unknown"].includes(mutation.status)
      ),
    [tableMutations]
  )
  const visibleMutations = useMemo(
    () =>
      tableMutations.filter(
        (mutation) =>
          mutation.status !== "completed" && mutation.status !== "failed"
      ),
    [tableMutations]
  )
  const failedMutations = useMemo(
    () => tableMutations.filter((mutation) => mutation.status === "failed"),
    [tableMutations]
  )
  const mutationRowLabel = (rowId: number) =>
    customTableMutationRowLabel(rowId, rows, table.columns) ??
    t("customTablesMutationRowFallback", { id: rowId })

  useEffect(() => {
    if (!mutationsLoaded) return
    // Existing failures are history; newly arriving failures still notify once.
    if (seenFailureIds.current !== null) {
      for (const mutation of failedMutations) {
        if (seenFailureIds.current.has(mutation.id)) continue
        const label =
          customTableMutationRowLabel(mutation.rowId, rows, table.columns) ??
          t("customTablesMutationRowFallback", { id: mutation.rowId })
        toast.error(
          `${label}: ${t("customTablesMutationFailed", { action: mutation.mutationType })}`
        )
      }
    }
    seenFailureIds.current ??= new Set()
    for (const mutation of failedMutations)
      seenFailureIds.current.add(mutation.id)
  }, [failedMutations, mutationsLoaded, rows, table.columns, t])
  const activeRowIds = useMemo(
    () => new Set(activeMutations.map((mutation) => String(mutation.rowId))),
    [activeMutations]
  )
  const tableMutationPending = activeMutations.length > 0
  const addDisabled =
    tableMutationPending || Boolean(maxRows && rows.length >= maxRows)

  const initializeForm = useCallback(
    (
      columns: CustomTableColumn[],
      row?: CustomTableRow | null,
      options: { preserveRedactedSecrets?: boolean } = {}
    ) => {
      const next: Record<string, string> = {}
      for (const col of columns) {
        const value =
          row?.[col.name] ?? col.inputField?.defaultValue ?? col.defaultValue
        const textValue = toTextValue(value)
        next[col.name] =
          options.preserveRedactedSecrets &&
          isSensitiveColumn(col) &&
          textValue === REDACTED_SECRET_VALUE
            ? ""
            : textValue
      }
      setFormValues(next)
      setFormErrors({})
      setFormSession((session) => session + 1)
    },
    [setFormValues, setFormErrors]
  )

  const openAdd = () => {
    addIdempotencyKey.current = null
    initializeForm(inputDataColumns, null)
    setAddOpen(true)
  }

  const openEdit = useCallback(
    (row: CustomTableRow) => {
      editIdempotencyKey.current = null
      initializeForm(editableColumnsForEdit, row, {
        preserveRedactedSecrets: true
      })
      setEditTarget(row)
    },
    [editableColumnsForEdit, initializeForm, setEditTarget]
  )

  const validateForm = (
    columns: CustomTableColumn[],
    row: CustomTableRow | null = null
  ): boolean => {
    const nextErrors: Record<string, string> = {}
    for (const col of columns) {
      if (!isFieldVisible(col, formValues)) continue
      const value = formValues[col.name] ?? ""
      if (shouldPreserveRedactedSensitiveValue(col, row, value)) continue

      const code = validateValue(col, value)
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
    addIdempotencyKey.current ??= createIdempotencyKey("custom_table.create")
    try {
      const result = await addMutation.mutateAsync({
        payload: formValues,
        idempotencyKey: addIdempotencyKey.current
      })
      if (isMutationAdmission(result) && result.status === "failed") {
        addIdempotencyKey.current = null
        toast.error(
          t("customTablesMutationFailed", {
            action: result.mutationType
          })
        )
        return
      }
      if (isMutationAdmission(result) && result.status === "unknown") {
        toast.error(
          t("customTablesMutationUnknown", {
            action: result.mutationType
          })
        )
        return
      }
      addIdempotencyKey.current = null
      setAddOpen(false)
      toast.success(
        isMutationAdmission(result)
          ? result.status === "completed"
            ? t("customTablesAddSuccess")
            : result.status === "admission_pending"
              ? t("customTablesAdmissionPending")
              : t("customTablesMutationQueued")
          : t("customTablesAddSuccess")
      )
    } catch (error) {
      toast.error(
        t(
          isDuplicateCustomTableValueError(error)
            ? "customTablesDuplicateValue"
            : "customTablesAddFailed"
        )
      )
    }
  }

  const buildEditPayload = (): Record<string, string> => {
    const payload: Record<string, string> = {}
    for (const col of editableColumnsForEdit) {
      if (!isFieldVisible(col, formValues)) continue
      const value = formValues[col.name] ?? ""
      if (shouldPreserveRedactedSensitiveValue(col, editTarget, value)) {
        continue
      }
      payload[col.name] = value
    }
    return payload
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!validateForm(editableColumnsForEdit, editTarget)) return
    editIdempotencyKey.current ??= createIdempotencyKey("custom_table.update")
    try {
      const result = await updateMutation.mutateAsync({
        rowId: editTarget.id,
        payload: buildEditPayload(),
        idempotencyKey: editIdempotencyKey.current
      })
      if (isMutationAdmission(result) && result.status === "failed") {
        editIdempotencyKey.current = null
        toast.error(
          t("customTablesMutationFailed", {
            action: result.mutationType
          })
        )
        return
      }
      if (isMutationAdmission(result) && result.status === "unknown") {
        toast.error(
          t("customTablesMutationUnknown", {
            action: result.mutationType
          })
        )
        return
      }
      editIdempotencyKey.current = null
      setEditTarget(null)
      toast.success(
        isMutationAdmission(result)
          ? result.status === "completed"
            ? t("customTablesEditSuccess")
            : result.status === "admission_pending"
              ? t("customTablesAdmissionPending")
              : t("customTablesMutationQueued")
          : t("customTablesEditSuccess")
      )
    } catch (error) {
      toast.error(
        t(
          isDuplicateCustomTableValueError(error)
            ? "customTablesDuplicateValue"
            : "customTablesEditFailed"
        )
      )
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

  const handleRowAction = async () => {
    if (!actionTarget) return
    try {
      await rowActionMutation.mutateAsync({
        ...actionTarget,
        confirmationValue: actionConfirmation
      })
      toast.success(t("customTablesActionSuccess"))
      setActionTarget(null)
      setActionConfirmation("")
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim()
          ? error.message
          : t("customTablesActionFailed")
      )
    }
  }

  const handleRetry = async (mutationId: number) => {
    try {
      const result = await retryMutation.mutateAsync(mutationId)
      if (result.status === "failed" || result.status === "unknown") {
        toast.error(
          t(
            result.status === "failed"
              ? "customTablesMutationFailed"
              : "customTablesMutationUnknown",
            { action: result.mutationType }
          )
        )
      } else if (result.status === "admission_pending") {
        toast.info(t("customTablesAdmissionPending"))
      }
    } catch {
      toast.error(t("customTablesRetryFailed"))
    }
  }

  const toggleSensitiveVisibility = useCallback(
    async (rowId: number | string, column: CustomTableColumn) => {
      const key = `${rowId}:${column.name}`
      if (revealedPasswords[key]) {
        setRevealedPasswords((prev) => ({ ...prev, [key]: false }))
        return
      }

      if (typeof column.fieldId !== "number") {
        toast.error(t("customTablesRevealFailed"))
        return
      }

      if (revealedPasswordValues[key] === undefined) {
        try {
          setRevealingPasswordKey(key)
          const value = await revealMutation.mutateAsync({
            rowId,
            fieldId: column.fieldId
          })
          setRevealedPasswordValues((prev) => ({ ...prev, [key]: value }))
        } catch {
          toast.error(t("customTablesRevealFailed"))
          return
        } finally {
          setRevealingPasswordKey(null)
        }
      }

      setRevealedPasswords((prev) => ({
        ...prev,
        [key]: true
      }))
    },
    [revealedPasswords, revealedPasswordValues, revealMutation, t]
  )

  /* ── Form fields ── */

  const changeField = (
    columns: CustomTableColumn[],
    col: CustomTableColumn,
    next: FieldChange
  ) => {
    if (addOpen) addIdempotencyKey.current = null
    if (editTarget) editIdempotencyKey.current = null
    if (typeof next === "string" || typeof next === "number") {
      setFormValues((prev) =>
        clearHiddenFieldValues(
          columns.map((column) => [column.name, column]),
          { ...prev, [col.name]: String(next) }
        )
      )
      return
    }
    if (typeof next === "boolean") {
      setFormValues((prev) => ({
        ...prev,
        [col.name]: next ? "1" : "0"
      }))
      return
    }
    const targetValue = next?.target?.value
    if (typeof targetValue === "string" || typeof targetValue === "number") {
      setFormValues((prev) => ({
        ...prev,
        [col.name]: String(targetValue)
      }))
      return
    }
    setFormValues((prev) => ({ ...prev, [col.name]: "" }))
  }

  const renderFormFields = (columns: CustomTableColumn[]) => {
    return columns
      .filter((col) => isFieldVisible(col, formValues))
      .map((col) => (
        <CustomTableField
          key={`${formSession}:${col.name}`}
          config={mapColumnToFormConfig(col)}
          value={formValues[col.name] ?? ""}
          error={formErrors[col.name]}
          onChange={(next) => changeField(columns, col, next)}
        />
      ))
  }

  /* ── Rows on show ── */

  const listedColumns = orderedColumns.filter(
    (column) => column.type !== "hidden"
  )
  const shownColumns = listedColumns.filter(
    (column) => !hiddenColumns.has(column.name)
  )
  const hasActions = canEdit || canDelete || rowActions.length > 0

  // The search looks at one column, the first that holds data.
  const searchColumn = orderedColumns.find((col) => isDataColumn(col))
  const searchName =
    searchColumn && searchColumn.type !== "hidden" ? searchColumn.name : null
  const needle = query.toLowerCase()
  const matches =
    searchName !== null && needle !== ""
      ? rows.filter((row) => matchesSearch(row, searchName, needle))
      : rows
  // Array.sort is stable, so ties keep the server's order.
  const ordered = sort
    ? [...matches].sort(
        (a, b) => compareRows(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1)
      )
    : matches
  const pageCount = Math.max(1, Math.ceil(ordered.length / perPage))
  const currentPage = Math.min(page, pageCount)
  const pageRows = ordered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )
  const sizeOptions = pageSizeOptions(perPage)

  const renderValue = (row: CustomTableRow, column: CustomTableColumn) => {
    const rawValue = row[column.name]
    const value = toTextValue(rawValue)
    const fieldType = column.type ?? column.inputField?.type

    if (fieldType === "switch" || fieldType === "IsEnabledCell") {
      const enabled = value === "1" || value.toLowerCase() === "true"
      return (
        <EnabledBadge
          enabled={enabled}
          label={enabled ? t("customTablesEnabled") : t("customTablesDisabled")}
        />
      )
    }

    if (isSensitiveColumn(column)) {
      const passwordKey = `${row.id}:${column.name}`
      const isRevealed = Boolean(revealedPasswords[passwordKey])
      const displayValue = revealedPasswordValues[passwordKey] ?? value
      const canReveal = isRevealableColumn(column) && value !== ""
      const isRevealing = revealingPasswordKey === passwordKey
      return (
        <SecretValue
          title={column.title || column.name}
          text={isRevealed ? displayValue || "—" : SECRET_MASK}
          canReveal={canReveal}
          revealed={isRevealed}
          revealing={isRevealing}
          onToggle={() => void toggleSensitiveVisibility(row.id, column)}
        />
      )
    }

    if (
      (fieldType === "externalURL" || fieldType === "clientURL") &&
      value.trim() !== ""
    ) {
      const href = /^https?:\/\//i.test(value) ? value : `https://${value}`
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-kumo-link no-underline hover:underline"
        >
          {value}
        </a>
      )
    }

    return value || "—"
  }

  /* ── Dialog contents ── */

  // The row action dialog reads everything from its target, which is gone the
  // moment the dialog starts to close.
  const shownAction = useLastValue(actionTarget)
  const confirmation = shownAction?.action.confirmation
  const expectedConfirmation =
    shownAction && confirmation
      ? (confirmation.expectedValue ??
        toTextValue(shownAction.row[confirmation.rowField ?? ""]))
      : null

  const editLabel = t("customTablesEditTitle", { label: table.label })
  const deleteLabel = t("customTablesDeleteTitle")
  const hasIntro = Boolean(table.description || maxRows)
  const hasNotices = visibleMutations.length > 0 || failedMutations.length > 0
  const hasColumnsMenu = listedColumns.length > 0

  return (
    <>
      <Panel
        title={table.label}
        count={isLoading ? undefined : rows.length}
        flush
        action={
          hasColumnsMenu || canAdd ? (
            <>
              {hasColumnsMenu && (
                <ColumnsMenu
                  columns={listedColumns}
                  hidden={hiddenColumns}
                  onToggle={(name, visible) =>
                    setHiddenColumns((current) => {
                      const next = new Set(current)
                      if (visible) next.delete(name)
                      else next.add(name)
                      return next
                    })
                  }
                />
              )}
              {canAdd && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={PlusIcon}
                  onClick={openAdd}
                  disabled={addDisabled}
                >
                  {t("customTablesAdd")}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {(hasIntro || hasNotices) && (
          <div className="grid grid-cols-1 gap-3 border-b border-kumo-hairline p-3">
            {hasIntro && (
              <div className="grid grid-cols-1 gap-0.5 text-kumo-subtle">
                {table.description && <p>{table.description}</p>}
                {maxRows ? (
                  <RowsUsage current={rows.length} max={maxRows} />
                ) : null}
              </div>
            )}
            {visibleMutations.length > 0 ? (
              <MutationNotices
                mutations={visibleMutations}
                rowLabel={mutationRowLabel}
                retrying={retryMutation.isPending}
                onRetry={(mutationId) => void handleRetry(mutationId)}
              />
            ) : null}
            {failedMutations.length > 0 ? (
              <FailedHistory
                mutations={failedMutations}
                rowLabel={mutationRowLabel}
              />
            ) : null}
          </div>
        )}

        {searchName !== null && (
          <div className="border-b border-kumo-hairline p-3">
            <InputGroup className="w-full max-w-xs">
              <InputGroup.Addon>
                <MagnifyingGlassIcon />
              </InputGroup.Addon>
              <InputGroup.Input
                value={query}
                placeholder={t("customTablesSearch", { label: table.label })}
                aria-label={t("customTablesSearch", { label: table.label })}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
              {query && (
                <InputGroup.Addon align="end" className="pr-1">
                  <InputGroup.Button
                    shape="square"
                    icon={XIcon}
                    aria-label={COPY.clearSearch}
                    onClick={() => {
                      setQuery("")
                      setPage(1)
                    }}
                  />
                </InputGroup.Addon>
              )}
            </InputGroup>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-3 p-4">
            <SkeletonLine className="h-2.5 w-1/3 rounded-full" />
            <SkeletonLine className="h-2.5 w-2/3 rounded-full" />
            <SkeletonLine className="h-2.5 w-1/2 rounded-full" />
          </div>
        ) : pageRows.length === 0 ? (
          <Empty
            className={EMPTY_IN_CARD}
            size="sm"
            icon={<RowsIcon size={32} />}
            title={t("customTablesEmpty")}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  {shownColumns.map((column) => (
                    <SortHead
                      key={column.name}
                      label={column.title || column.name}
                      sortKey={column.name}
                      sort={sort}
                      onSort={(key) => {
                        setSort((current) => nextSort(current, key))
                        setPage(1)
                      }}
                    />
                  ))}
                  {hasActions && (
                    <Table.Head>
                      <span className="sr-only">
                        {t("customTablesActions")}
                      </span>
                    </Table.Head>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pageRows.map((row) => {
                  const rowMutationPending = activeRowIds.has(String(row.id))
                  return (
                    <Table.Row key={row.id}>
                      {shownColumns.map((column) => (
                        <Table.Cell key={column.name}>
                          {renderValue(row, column)}
                        </Table.Cell>
                      ))}
                      {hasActions && (
                        <Table.Cell>
                          <span className="flex items-center justify-end gap-1">
                            {rowActions.map((action) => (
                              <Button
                                key={action.name}
                                size="sm"
                                variant={
                                  action.variant === "destructive"
                                    ? "secondary-destructive"
                                    : "secondary"
                                }
                                icon={
                                  action.variant === "destructive"
                                    ? TrashIcon
                                    : PlayIcon
                                }
                                disabled={
                                  rowActionMutation.isPending ||
                                  rowMutationPending
                                }
                                onClick={() => {
                                  setActionConfirmation("")
                                  setActionTarget({ action, row })
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                            {canEdit && (
                              <Tooltip
                                content={editLabel}
                                render={
                                  <Button
                                    size="sm"
                                    shape="square"
                                    icon={PencilSimpleIcon}
                                    aria-label={editLabel}
                                    disabled={tableMutationPending}
                                    onClick={() => openEdit(row)}
                                  />
                                }
                              />
                            )}
                            {canDelete && (
                              <Tooltip
                                content={deleteLabel}
                                render={
                                  <Button
                                    size="sm"
                                    shape="square"
                                    variant="secondary-destructive"
                                    icon={TrashIcon}
                                    aria-label={deleteLabel}
                                    disabled={rowMutationPending}
                                    onClick={() => setDeleteTarget(row)}
                                  />
                                }
                              />
                            )}
                          </span>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        )}

        {ordered.length > Math.min(...sizeOptions) && (
          <div className="border-t border-kumo-hairline p-3">
            <Pagination
              page={currentPage}
              setPage={setPage}
              perPage={perPage}
              totalCount={ordered.length}
              className="flex-wrap gap-y-3"
            >
              <Pagination.Info className="whitespace-nowrap" />
              <Pagination.PageSize
                value={perPage}
                options={sizeOptions}
                onChange={(size) => {
                  setPerPage(size)
                  setPage(1)
                }}
              />
              <Pagination.Controls />
            </Pagination>
          </div>
        )}
      </Panel>

      <FormDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setFormErrors({})
        }}
        title={t("customTablesAddTitle", { label: table.label })}
        description={t("customTablesAddDescription")}
        footer={
          <>
            <Button
              onClick={() => setAddOpen(false)}
              disabled={addMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button
              variant="primary"
              data-dialog-submit="true"
              onClick={handleAdd}
              loading={addMutation.isPending}
            >
              {t("customTablesSave")}
            </Button>
          </>
        }
      >
        {renderFormFields(inputDataColumns)}
      </FormDialog>

      <ConfirmDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null)
            setActionConfirmation("")
          }
        }}
        title={shownAction?.action.dialogTitle ?? shownAction?.action.label}
        description={
          shownAction?.action.dialogText ?? t("customTablesActionDescription")
        }
        footer={
          <>
            <Button
              disabled={rowActionMutation.isPending}
              onClick={() => setActionTarget(null)}
            >
              {t("customTablesCancel")}
            </Button>
            <Button
              variant={
                shownAction?.action.variant === "destructive"
                  ? "destructive"
                  : "primary"
              }
              data-dialog-submit="true"
              loading={rowActionMutation.isPending}
              disabled={
                confirmation
                  ? actionConfirmation !== expectedConfirmation
                  : false
              }
              onClick={handleRowAction}
            >
              {shownAction?.action.label}
            </Button>
          </>
        }
      >
        {confirmation ? (
          <Input
            label={
              confirmation.label ??
              t("customTablesConfirmationLabel", {
                value: expectedConfirmation ?? ""
              })
            }
            value={actionConfirmation}
            placeholder={confirmation.placeholder}
            onChange={(event) => setActionConfirmation(event.target.value)}
            autoComplete="off"
          />
        ) : null}
      </ConfirmDialog>

      <FormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
          setFormErrors({})
        }}
        title={t("customTablesEditTitle", { label: table.label })}
        description={t("customTablesEditDescription")}
        footer={
          <>
            <Button
              onClick={() => setEditTarget(null)}
              disabled={updateMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button
              variant="primary"
              data-dialog-submit="true"
              onClick={handleEdit}
              loading={updateMutation.isPending}
            >
              {t("customTablesUpdate")}
            </Button>
          </>
        }
      >
        {renderFormFields(editableColumnsForEdit)}
      </FormDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("customTablesDeleteTitle")}
        description={t("customTablesDeleteDescription")}
        footer={
          <>
            <Button
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {t("customTablesCancel")}
            </Button>
            <Button
              variant="destructive"
              data-dialog-submit="true"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              {t("customTablesDelete")}
            </Button>
          </>
        }
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  All of an app's tables                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The data tables an installed app defines (its users, shares and so on), one
 * panel each. Renders nothing for an app without tables.
 */
export function CustomTables({ appId }: { appId: number }) {
  const t = useTranslations("appboxmanager.appDetail")
  const { data: tables = [], isLoading } = useInstanceCustomTables(appId)

  if (!isLoading && tables.length === 0) return null

  if (isLoading) {
    return (
      <Panel title={t("customTablesTitle")}>
        <LoadingRow>{t("customTablesLoading")}</LoadingRow>
      </Panel>
    )
  }

  return (
    <>
      {tables.map((table) => (
        <CustomTablePanel key={`${appId}-${table.APIRoute}`} table={table} />
      ))}
    </>
  )
}
