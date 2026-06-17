import type { ComparisonMatrixBlock as ComparisonMatrixBlockType } from "@/types/marketing-blocks"

interface ComparisonMatrixBlockProps {
  block: ComparisonMatrixBlockType
}

export function ComparisonMatrixBlock({ block }: ComparisonMatrixBlockProps) {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-6xl">
        {(block.title || block.intro) && (
          <div className="mx-auto mb-8 max-w-3xl text-center">
            {block.title && (
              <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                {block.title}
              </h2>
            )}
            {block.intro && (
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {block.intro}
              </p>
            )}
          </div>
        )}

        <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-border/70 bg-background/70 shadow-sm [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 z-10 w-48 bg-muted/50 px-5 py-4 text-left font-semibold">
                  Criteria
                </th>
                {block.columns.map((column) => (
                  <th
                    key={column.key}
                    className="min-w-44 px-5 py-4 text-left font-semibold"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {block.rows.map((row) => (
                <tr key={row.label} className="align-top">
                  <th className="sticky left-0 z-10 bg-background px-5 py-4 text-left font-semibold">
                    {row.label}
                  </th>
                  {block.columns.map((column) => (
                    <td
                      key={`${row.label}-${column.key}`}
                      className="px-5 py-4 leading-6 text-muted-foreground"
                    >
                      {row.values[column.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
