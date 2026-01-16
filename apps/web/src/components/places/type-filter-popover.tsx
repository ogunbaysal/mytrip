"use client";

import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PlaceType = {
  type: string;
  name: string;
  count: number;
};

const PLACE_TYPES: PlaceType[] = [
  { type: "hotel", name: "Otel", count: 0 },
  { type: "restaurant", name: "Restoran", count: 0 },
  { type: "cafe", name: "Kafe", count: 0 },
  { type: "activity", name: "Aktivite", count: 0 },
  { type: "attraction", name: "Gezi Yeri", count: 0 },
];

type TypeFilterPopoverProps = {
  selectedType?: string;
  onTypeChange: (type: string | undefined) => void;
  types?: PlaceType[];
};

export function TypeFilterPopover({
  selectedType,
  onTypeChange,
  types = PLACE_TYPES,
}: TypeFilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilter = !!selectedType;
  const selectedTypeData = types.find((t) => t.type === selectedType);

  const handleSelect = (type: string) => {
    if (type === selectedType) {
      onTypeChange(undefined);
    } else {
      onTypeChange(type);
    }
    setOpen(false);
  };

  const displayLabel = selectedTypeData?.name ?? "Tür";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 gap-2 rounded-full border-gray-200 bg-white px-4 text-sm font-normal shadow-sm hover:border-gray-300 hover:bg-gray-50 ${
            hasActiveFilter ? "border-gray-900 bg-gray-50 font-medium" : ""
          }`}
        >
          {displayLabel}
          <ChevronDown className="size-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {types.map((type) => (
            <button
              key={type.type}
              onClick={() => handleSelect(type.type)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100",
                selectedType === type.type && "bg-gray-100",
              )}
            >
              <span className="font-medium text-gray-700">{type.name}</span>
              <div className="flex items-center gap-2">
                {type.count > 0 && (
                  <span className="text-xs text-gray-400">{type.count}</span>
                )}
                {selectedType === type.type && (
                  <Check className="size-4 text-gray-900" />
                )}
              </div>
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onTypeChange(undefined);
                setOpen(false);
              }}
              className="w-full text-gray-500"
            >
              Filtreyi Temizle
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
