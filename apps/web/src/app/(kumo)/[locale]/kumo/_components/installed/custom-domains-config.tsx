"use client"

import { useTranslations } from "next-intl"
import { Banner, Button, cn, Dialog } from "@cloudflare/kumo"
import {
  CheckIcon,
  CopyIcon,
  ShieldCheckIcon,
  WarningIcon,
  XIcon
} from "@phosphor-icons/react"
import type { InstanceDomainConfigResponse } from "@/api/domains/hooks/use-domains"

/* -------------------------------------------------------------------------- */
/*  Snippets                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A block of text to paste somewhere else, with a button that copies it.
 *
 * Built here rather than taken from Kumo: ClipboardText and InlineCopyText
 * keep their value on one truncated line, Code and CodeBlock have no copy
 * button and are deprecated, and CodeHighlighted needs a syntax highlighter
 * that has no grammar for web server configuration.
 */
function CopyBlock({
  label,
  value,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
  className
}: {
  label: string
  value: string
  copied: boolean
  copyLabel: string
  copiedLabel: string
  onCopy: () => void
  /** For the text itself, e.g. a height past which it scrolls. */
  className?: string
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 overflow-hidden rounded-lg bg-kumo-elevated ring ring-kumo-hairline">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-kumo-hairline py-1.5 ps-3 pe-1.5">
        <p className="truncate text-sm text-kumo-subtle">{label}</p>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0"
          icon={copied ? <CheckIcon className="text-kumo-success" /> : CopyIcon}
          onClick={onCopy}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre
        className={cn(
          "overflow-auto p-3 font-mono text-[0.9em] leading-relaxed wrap-break-word whitespace-pre-wrap",
          className
        )}
      >
        {value}
      </pre>
    </div>
  )
}

function SnippetBlock({
  title,
  fileLabel,
  configLabel,
  commandLabel,
  notesLabel,
  copyLabel,
  copiedLabel,
  copiedItem,
  onCopy,
  file,
  config,
  command,
  notes
}: {
  title: string
  fileLabel: string
  configLabel: string
  commandLabel: string
  notesLabel: string
  copyLabel: string
  copiedLabel: string
  copiedItem: string | null
  onCopy: (value: string, key: string) => void
  file?: string
  config?: string
  command?: string
  notes?: string
}) {
  if (!config) return null

  return (
    // Every server after the first is set off by a rule.
    <section className="grid min-w-0 grid-cols-1 gap-3 not-first-of-type:border-t not-first-of-type:border-kumo-hairline not-first-of-type:pt-5">
      <div className="grid gap-1">
        <h3 className="font-semibold">{title}</h3>
        {file && (
          <p className="text-kumo-subtle">
            {fileLabel}:{" "}
            <code className="font-mono text-[0.9em] break-all text-kumo-default">
              {file}
            </code>
          </p>
        )}
      </div>

      <CopyBlock
        label={configLabel}
        value={config}
        copied={copiedItem === `${title}-config`}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        onCopy={() => onCopy(config, `${title}-config`)}
        className="max-h-64"
      />

      {command && (
        <CopyBlock
          label={commandLabel}
          value={command}
          copied={copiedItem === `${title}-command`}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          onCopy={() => onCopy(command, `${title}-command`)}
        />
      )}

      {notes && (
        <p className="leading-relaxed text-kumo-subtle">
          <span className="font-medium text-kumo-default">{notesLabel}: </span>
          {notes}
        </p>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dialog                                                                     */
/* -------------------------------------------------------------------------- */

interface CustomDomainConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The last configuration fetched. Kept while closed so the dialog can animate out. */
  configData: InstanceDomainConfigResponse | null
  /** Key of the snippet copied a moment ago, if any. */
  copiedItem: string | null
  onCopy: (value: string, key: string) => void
}

/** The web server snippets for one domain, each with a copy button. */
export function CustomDomainConfigDialog({
  open,
  onOpenChange,
  configData,
  copiedItem,
  onCopy
}: CustomDomainConfigDialogProps) {
  const t = useTranslations("appboxmanager.appDetail")

  const snippetLabels = {
    fileLabel: t("customDomainsFile"),
    configLabel: t("customDomainsConfigSnippet"),
    commandLabel: t("customDomainsReloadCommand"),
    notesLabel: t("customDomainsNotes"),
    copyLabel: t("customDomainsCopy"),
    copiedLabel: t("customDomainsCopied"),
    copiedItem,
    onCopy
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl">
        {/* Capped at the popup's height so the snippets scroll between a
            fixed header and footer. */}
        <div className="relative flex max-h-[inherit] flex-col">
          <header className="grid shrink-0 gap-1.5 border-b border-kumo-line py-5 ps-6 pe-16">
            <Dialog.Title className="text-lg font-semibold wrap-break-word">
              {t("customDomainsConfigTitle", {
                domain: configData?.domain ?? "—"
              })}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              {t("customDomainsConfigDescription")}
            </Dialog.Description>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 overflow-x-hidden overflow-y-auto px-6 py-5">
            {configData?.is_custom_domain !== false ? (
              <Banner
                variant="alert"
                icon={<WarningIcon weight="fill" />}
                description={t("customDomainsSslQueued")}
              />
            ) : (
              // Kumo's Banner has no success variant, so this borrows its layout.
              <div className="flex items-start gap-3 rounded-lg bg-kumo-success-tint px-4 py-3 text-kumo-success">
                <span className="flex h-lh shrink-0 items-center">
                  <ShieldCheckIcon aria-hidden="true" size={16} weight="fill" />
                </span>
                <p>{t("customDomainsWildcardSsl")}</p>
              </div>
            )}

            <SnippetBlock
              {...snippetLabels}
              title={t("customDomainsNginx")}
              file={configData?.config_snippets?.nginx?.file}
              config={configData?.config_snippets?.nginx?.config}
              command={
                configData?.config_snippets?.nginx?.enable_command ??
                configData?.config_snippets?.nginx?.reload_command
              }
              notes={configData?.config_snippets?.nginx?.notes}
            />

            <SnippetBlock
              {...snippetLabels}
              title={t("customDomainsApache")}
              file={configData?.config_snippets?.apache?.file}
              config={configData?.config_snippets?.apache?.config}
              command={
                configData?.config_snippets?.apache?.enable_command ??
                configData?.config_snippets?.apache?.reload_command
              }
              notes={configData?.config_snippets?.apache?.notes}
            />
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("customDomainsClose")}
            </Button>
          </footer>

          <Dialog.Close
            render={
              <Button
                variant="ghost"
                shape="square"
                aria-label={t("customDomainsClose")}
                icon={XIcon}
                className="absolute end-4 top-4"
              />
            }
          />
        </div>
      </Dialog>
    </Dialog.Root>
  )
}
