"use client"

import { motion } from "framer-motion"
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

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as const
    }
  })
}

export function ComparisonBlock({ block }: ComparisonBlockProps) {
  const ourName = block.our_name || "Appbox"
  const otherName = block.other_name || "Other"

  return (
    <section className="py-16">
      {block.title && (
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl"
        >
          {block.title}
        </motion.h2>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl overflow-x-auto overscroll-x-contain rounded-xl border [-webkit-overflow-scrolling:touch]"
      >
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
              <motion.tr
                key={i}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-6 py-4 font-medium">{row.feature}</td>
                <td className="px-6 py-4 text-center">
                  <CellContent value={row.us} />
                </td>
                <td className="text-muted-foreground px-6 py-4 text-center">
                  <CellContent value={row.them} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  )
}
