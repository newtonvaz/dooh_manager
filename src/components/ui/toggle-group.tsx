"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleGroupProps {
  type: "single"
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function ToggleGroup({ type, value, onValueChange, children, className }: ToggleGroupProps) {
  return (
    <div className={cn("inline-flex items-center rounded-md border bg-muted/50 p-0.5", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<ToggleGroupItemProps>(child)) {
          return React.cloneElement(child, {
            selected: value === child.props.value,
            onClick: () => onValueChange(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

interface ToggleGroupItemProps {
  value: string
  children: React.ReactNode
  className?: string
  "aria-label"?: string
  size?: "sm" | "default"
  selected?: boolean
  onClick?: () => void
}

function ToggleGroupItem({
  value,
  children,
  className,
  "aria-label": ariaLabel,
  size = "default",
  selected,
  onClick,
}: ToggleGroupItemProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        size === "sm" ? "h-7 px-2" : "h-9 px-3",
        className
      )}
    >
      {children}
    </button>
  )
}

export { ToggleGroup, ToggleGroupItem }
