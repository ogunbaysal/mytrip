"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";

interface StatCardProps {
  /** Main label for the stat */
  label: string;
  /** Primary value to display */
  value: string | number;
  /** Secondary value (e.g., max limit) */
  subValue?: string | number;
  /** Icon component */
  icon: ReactNode;
  /** Gradient for icon background */
  iconGradient?: string;
  /** Show progress bar */
  showProgress?: boolean;
  /** Current progress value (0-100) */
  progressValue?: number;
  /** Additional content below the main stat */
  footer?: ReactNode;
  /** Animation delay index */
  index?: number;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  iconGradient = "from-primary to-primary/80",
  showProgress = false,
  progressValue = 0,
  footer,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-white p-5 shadow-sm"
    >
      {/* Header with icon and label */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            {subValue !== undefined && (
              <span className="text-sm font-medium text-muted-foreground">
                / {subValue}
              </span>
            )}
          </div>
        </div>

        {/* Icon badge with gradient */}
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            iconGradient,
          )}
        >
          {icon}
        </div>
      </div>

      {/* Progress bar section */}
      {showProgress && (
        <div className="mt-4">
          <ProgressBar value={progressValue} showLabel size="sm" />
        </div>
      )}

      {/* Optional footer content */}
      {footer && (
        <div className="mt-4 border-t border-border/50 pt-4">{footer}</div>
      )}
    </motion.div>
  );
}
