"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description/subtitle */
  description?: string;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Breadcrumb navigation */
  breadcrumbs?: Breadcrumb[];
  /** Action buttons on the right */
  actions?: ReactNode;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-4" />}
              {crumb.href ? (
                <Link
                  href={crumb.href as any}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title and actions row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}
