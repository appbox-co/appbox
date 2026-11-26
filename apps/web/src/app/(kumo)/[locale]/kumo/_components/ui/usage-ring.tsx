/** Small ring gauge, coloured like the usage bars: brand, warning from 75%, danger from 90%. */
export function UsageRing({ percent }: { percent: number }) {
  // Stroke utilities read the same colour tokens as the usage bars' fills.
  const tone =
    percent >= 90
      ? "stroke-kumo-danger"
      : percent >= 75
        ? "stroke-kumo-warning"
        : "stroke-kumo-brand"
  const circumference = 2 * Math.PI * 6
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0 -rotate-90"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2.5"
        className="stroke-kumo-fill"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={tone}
        strokeDasharray={circumference}
        strokeDashoffset={
          circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100)
        }
      />
    </svg>
  )
}
