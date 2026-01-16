"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action href */
  actionHref?: string;
  /** Primary action onClick handler */
  onAction?: () => void;
  /** Secondary action label */
  secondaryLabel?: string;
  /** Secondary action href */
  secondaryHref?: string;
  /** Additional className */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50/50 px-6 py-12 text-center",
        className,
      )}
    >
      {/* Icon */}
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon || <FolderOpen className="size-8" />}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(actionLabel && actionHref) || onAction ? (
          actionHref ? (
            <Link href={actionHref as any}>
              <Button>
                <Plus className="mr-2 size-4" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction}>
              <Plus className="mr-2 size-4" />
              {actionLabel}
            </Button>
          )
        ) : null}

        {secondaryLabel && secondaryHref && (
          <Link href={secondaryHref as any}>
            <Button variant="outline">{secondaryLabel}</Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
