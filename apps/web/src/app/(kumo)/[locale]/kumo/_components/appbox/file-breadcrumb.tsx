"use client"

import { useTranslations } from "next-intl"
import { CaretRightIcon, HouseIcon } from "@phosphor-icons/react"
import type { FileAncestor } from "@/api/files/files"

/** Prototype-only copy, in English and sentence case. */
const COPY = {
  label: "Folder path"
}

interface FileBreadcrumbProps {
  ancestors: FileAncestor[]
  currentName: string
  onNavigate: (id: string) => void
}

/**
 * Flatten the deeply-nested ancestors tree from the API into an ordered array.
 * The backend returns ancestors in a nested structure where each ancestor has
 * its own ancestors array. We flatten root → deepest.
 */
function flattenAncestors(ancestors: FileAncestor[]): FileAncestor[] {
  if (!ancestors || ancestors.length === 0) return []

  // The backend returns ancestors in order where the first entry has the
  // deepest nesting (root). Each subsequent entry is one level deeper.
  // However they may also be flat — just return them as-is.
  return ancestors
}

function Separator() {
  return (
    <CaretRightIcon
      aria-hidden="true"
      size={12}
      weight="bold"
      className="shrink-0 text-kumo-inactive"
    />
  )
}

/**
 * The path to the folder on show. Each folder above it is a button that opens
 * it, which is why this is not Kumo's Breadcrumbs: its items are links and
 * need an address, and a folder here has none.
 */
export function FileBreadcrumb({
  ancestors,
  currentName,
  onNavigate
}: FileBreadcrumbProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const flatAncestors = flattenAncestors(ancestors)

  return (
    <nav
      aria-label={COPY.label}
      className="flex min-h-7 items-center gap-0.5 overflow-x-auto text-kumo-subtle"
    >
      {flatAncestors.map((ancestor, index) => (
        <span key={ancestor.id} className="flex shrink-0 items-center gap-0.5">
          {index > 0 && <Separator />}
          <button
            type="button"
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kumo-brand"
            onClick={() => onNavigate(ancestor.id)}
          >
            {ancestor.name === "/" ? (
              <>
                <HouseIcon aria-hidden="true" size={14} />
                {t("root")}
              </>
            ) : (
              ancestor.name
            )}
          </button>
        </span>
      ))}

      {/* Current directory name */}
      {currentName && currentName !== "/" && (
        <span className="flex shrink-0 items-center gap-0.5">
          {flatAncestors.length > 0 && <Separator />}
          <span
            aria-current="page"
            className="px-1.5 font-medium text-kumo-default"
          >
            {currentName}
          </span>
        </span>
      )}

      {/* If at root and no ancestors, show home */}
      {flatAncestors.length === 0 && (!currentName || currentName === "/") && (
        <span
          aria-current="page"
          className="inline-flex h-7 items-center gap-1.5 px-1.5 font-medium text-kumo-default"
        >
          <HouseIcon aria-hidden="true" size={14} />
          {t("root")}
        </span>
      )}
    </nav>
  )
}
