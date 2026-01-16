"use client";

import { cn } from "@/lib/utils";

type StatusType =
  | "active"
  | "pending"
  | "rejected"
  | "inactive"
  | "suspended"
  | "draft"
  | "pending_review"
  | "published"
  | "archived"
  | "cancelled"
  | "expired";

interface StatusBadgeProps {
  status: StatusType | string;
  /** Custom label override */
  label?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Show dot indicator */
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  StatusType,
  { bg: string; text: string; dot: string; label: string }
> = {
  // Place statuses
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Yayında",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Beklemede",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Reddedildi",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Pasif",
  },
  suspended: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    label: "Askıda",
  },

  // Blog statuses
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Taslak",
  },
  pending_review: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "İncelemede",
  },
  published: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Yayında",
  },
  archived: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Arşivlenmiş",
  },

  // Subscription statuses
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "İptal",
  },
  expired: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: "Süresi Doldu",
  },
};

const DEFAULT_CONFIG = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  dot: "bg-slate-400",
  label: "Bilinmiyor",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  showDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as StatusType] || DEFAULT_CONFIG;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", config.dot)} />}
      {displayLabel}
    </span>
  );
}
