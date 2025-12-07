"use client"

import * as React from "react"
import * as rx from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof rx.Root>,
  React.ComponentPropsWithoutRef<typeof rx.Root>
>(({ className, children, ...props }, ref) => (
  <rx.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <rx.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </rx.Viewport>
    <ScrollBar />
    <rx.Corner />
  </rx.Root>
))
ScrollArea.displayName = rx.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof rx.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof rx.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <rx.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <rx.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </rx.ScrollAreaScrollbar>
))
ScrollBar.displayName = rx.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
