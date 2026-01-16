"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label text (overrides default percentage) */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom color - auto-determines based on value if not provided */
  color?: "primary" | "success" | "warning" | "danger";
  /** Show threshold colors automatically */
  autoColor?: boolean;
  /** Additional className for the container */
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const labelColorClasses = {
  primary: "text-primary",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

function getAutoColor(value: number): "success" | "warning" | "danger" {
  if (value >= 90) return "danger";
  if (value >= 70) return "warning";
  return "success";
}

export function ProgressBar({
  value,
  showLabel = false,
  label,
  size = "md",
  color,
  autoColor = true,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const effectiveColor =
    color || (autoColor ? getAutoColor(clampedValue) : "primary");
  const displayLabel = label || `${Math.round(clampedValue)}%`;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Kullanım</span>
          <span
            className={cn("font-medium", labelColorClasses[effectiveColor])}
          >
            {displayLabel}
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-slate-100",
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[effectiveColor],
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
