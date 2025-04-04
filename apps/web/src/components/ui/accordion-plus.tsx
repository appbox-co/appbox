"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-border border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-start py-4 text-left font-medium transition-all [&>span>svg>path:last-child]:origin-center [&>span>svg>path:last-child]:transition-all [&>span>svg>path:last-child]:duration-200 [&>span>svg]:-order-1 [&[data-state=open]>span>svg>path:last-child]:rotate-90 [&[data-state=open]>span>svg>path:last-child]:opacity-0 [&[data-state=open]>span>svg]:rotate-180",
        className
      )}
      {...props}
    >
      <span className="relative mr-4 mt-1 size-6 shrink-0 transition-all">
        <Plus
          size={16}
          strokeWidth={2}
          className="size-6 shrink-0 text-blue-500 transition-transform duration-200"
          aria-hidden="true"
        />
      </span>
      <div className="flex w-full items-start">
        <div className="flex-1">
          <h3 className="text-foreground text-lg font-medium">{children}</h3>
        </div>
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
