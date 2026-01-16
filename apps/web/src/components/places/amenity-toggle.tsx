"use client";

import { cn } from "@/lib/utils";

type AmenityToggleProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

export function AmenityToggle({
  label,
  isSelected,
  onClick,
}: AmenityToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-normal shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50",
        isSelected
          ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 hover:border-gray-800"
          : "border-gray-200 bg-white text-gray-700",
      )}
    >
      {label}
    </button>
  );
}
