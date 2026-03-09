"use client"

import { useTranslations } from "next-intl"
import { ChevronRight, Home } from "lucide-react"
import type { FileAncestor } from "@/api/files/files"
import { Button } from "@/components/ui/button"

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

export function FileBreadcrumb({
  ancestors,
  currentName,
  onNavigate
}: FileBreadcrumbProps) {
  const t = useTranslations("appboxmanager.fileExplorer")
  const flatAncestors = flattenAncestors(ancestors)

  return (
    <nav className="flex h-7 items-center gap-1 overflow-x-auto text-sm text-muted-foreground">
      {flatAncestors.map((ancestor, index) => (
        <span key={ancestor.id} className="flex items-center gap-1 shrink-0">
          {index > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground/50" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate(ancestor.id)}
          >
            {ancestor.name === "/" ? (
              <span className="flex items-center gap-1.5">
                <Home className="size-3.5" />
                {t("root")}
              </span>
            ) : (
              ancestor.name
            )}
          </Button>
        </span>
      ))}

      {/* Current directory name */}
      {currentName && currentName !== "/" && (
        <span className="flex items-center gap-1 shrink-0">
          {flatAncestors.length > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground/50" />
          )}
          <span className="px-2 text-sm font-medium text-foreground">
            {currentName}
          </span>
        </span>
      )}

      {/* If at root and no ancestors, show home */}
      {flatAncestors.length === 0 && (!currentName || currentName === "/") && (
        <span className="inline-flex h-7 items-center gap-1.5 px-2 text-sm font-medium leading-none text-foreground">
          <Home className="size-3.5" />
          {t("root")}
        </span>
      )}
    </nav>
  )
}
