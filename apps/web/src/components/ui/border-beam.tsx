import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  borderWidth?: number
}

export function BorderBeam({
  className,
  duration = 12,
  delay = 0,
  colorFrom = "#6366f1",
  colorTo = "#8b5cf6",
  borderWidth = 2
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]",
        className
      )}
      style={{
        padding: borderWidth,
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude"
      }}
    >
      <div
        className="absolute animate-[border-beam-spin_var(--beam-dur)_linear_var(--beam-delay)_infinite]"
        style={
          {
            "--beam-dur": `${duration}s`,
            "--beam-delay": `${delay}s`,
            inset: "-200%",
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 300deg, ${colorFrom} 330deg, ${colorTo} 350deg, transparent 360deg)`
          } as React.CSSProperties
        }
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes border-beam-spin { to { transform: rotate(360deg); } }`
        }}
      />
    </div>
  )
}
