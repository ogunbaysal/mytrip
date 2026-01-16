"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional gradient header area */
  header?: ReactNode;
  /** Card content */
  children: ReactNode;
  /** Enable hover animation effects */
  hoverable?: boolean;
  /** Custom padding - defaults to p-6 */
  padding?: "none" | "sm" | "md" | "lg";
  /** Show gradient accent at top */
  accentGradient?: string;
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const DashboardCard = forwardRef<HTMLDivElement, DashboardCardProps>(
  (
    {
      header,
      children,
      hoverable = false,
      padding = "md",
      accentGradient,
      className,
      ...props
    },
    ref,
  ) => {
    const cardContent = (
      <>
        {/* Accent gradient line at top */}
        {accentGradient && (
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r",
              accentGradient,
            )}
          />
        )}

        {/* Optional header section */}
        {header && (
          <div className="border-b border-border/50 bg-gradient-to-br from-slate-50 to-white px-6 py-4">
            {header}
          </div>
        )}

        {/* Card body */}
        <div className={cn(paddingClasses[padding])}>{children}</div>
      </>
    );

    const baseClasses = cn(
      "relative overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm",
      hoverable &&
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
      className,
    );

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={baseClasses}
          {...(props as any)}
        >
          {cardContent}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {cardContent}
      </div>
    );
  },
);

DashboardCard.displayName = "DashboardCard";
