import { Check, X } from "lucide-react"
import type { ComparisonBlock as ComparisonBlockType } from "@/types/marketing-blocks"

interface ComparisonBlockProps {
  block: ComparisonBlockType
}

function CellContent({ value }: { value: string }) {
  const lower = value.toLowerCase().trim()
  if (lower === "yes" || lower === "true" || lower === "✓") {
    return (
      <Check className="mx-auto size-5 text-green-600 dark:text-green-400" />
    )
  }
  if (lower === "no" || lower === "false" || lower === "✗") {
    return <X className="mx-auto size-5 text-red-500 dark:text-red-400" />
  }
  return <span>{value}</span>
}

export function ComparisonBlock({ block }: ComparisonBlockProps) {
  const ourName = block.our_name || "Appbox"
  const otherName = block.other_name || "Other"

  return (
    <section className="py-16">
      {block.title && (
        <h2 className="mb-10 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {block.title}
        </h2>
      )}

      <div className="mx-auto max-w-3xl overflow-x-auto overscroll-x-contain rounded-xl border [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[520px] text-sm md:min-w-0">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-4 text-left font-semibold">Feature</th>
              <th className="px-6 py-4 text-center font-semibold">{ourName}</th>
              <th className="text-muted-foreground px-6 py-4 text-center font-semibold">
                {otherName}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {block.rows.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-6 py-4 font-medium">{row.feature}</td>
                <td className="px-6 py-4 text-center">
                  <CellContent value={row.us} />
                </td>
                <td className="text-muted-foreground px-6 py-4 text-center">
                  <CellContent value={row.them} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
