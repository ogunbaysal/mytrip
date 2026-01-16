"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Main title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Optional action link */
  actionHref?: string;
  /** Action link label */
  actionLabel?: string;
  /** Custom action element (overrides actionHref) */
  action?: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: {
    title: "text-lg font-semibold",
    subtitle: "text-sm",
    icon: "size-5",
  },
  md: {
    title: "text-xl font-semibold",
    subtitle: "text-sm",
    icon: "size-5",
  },
  lg: {
    title: "text-2xl font-bold md:text-3xl",
    subtitle: "text-base",
    icon: "size-6",
  },
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  actionHref,
  actionLabel = "Tümünü Gör",
  action,
  size = "md",
  className,
}: SectionHeaderProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={cn("text-primary", sizes.icon)}>{icon}</span>
          )}
          <h2 className={cn("tracking-tight text-foreground", sizes.title)}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className={cn("text-muted-foreground", sizes.subtitle)}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Action area */}
      {action ? (
        action
      ) : actionHref ? (
        <Link
          href={actionHref as any}
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {actionLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
