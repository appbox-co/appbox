"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

type SliderProps = React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> & {
  trackClassName?: string
  trackStyle?: React.CSSProperties
  rangeClassName?: string
  rangeStyle?: React.CSSProperties
  thumbClassName?: string
}

function Slider({
  className,
  trackClassName,
  trackStyle,
  rangeClassName,
  rangeStyle,
  thumbClassName,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative h-2 w-full grow overflow-hidden rounded-full",
          trackClassName
        )}
        style={trackStyle}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn("bg-primary absolute h-full", rangeClassName)}
          style={rangeStyle}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className={cn(
          "border-primary bg-background ring-ring/50 block size-5 rounded-full border shadow-sm transition-[color,box-shadow,transform] focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
          thumbClassName
        )}
      />
    </SliderPrimitive.Root>
  )
}

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
