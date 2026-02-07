"use client";

import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useLocalizedFormatting } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PriceFilterPopoverProps = {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
  absoluteMin?: number;
  absoluteMax?: number;
  triggerClassName?: string;
};

export function PriceFilterPopover({
  minPrice,
  maxPrice,
  onPriceChange,
  absoluteMin = 0,
  absoluteMax = 10000,
  triggerClassName,
}: PriceFilterPopoverProps) {
  const { formatPrice } = useLocalizedFormatting();
  const [open, setOpen] = useState(false);
  const [localRange, setLocalRange] = useState<[number, number]>([
    minPrice ?? absoluteMin,
    maxPrice ?? absoluteMax,
  ]);

  useEffect(() => {
    setLocalRange([minPrice ?? absoluteMin, maxPrice ?? absoluteMax]);
  }, [minPrice, maxPrice, absoluteMin, absoluteMax]);

  const hasActiveFilter = minPrice !== undefined || maxPrice !== undefined;

  const handleApply = () => {
    const [min, max] = localRange;
    onPriceChange(
      min > absoluteMin ? min : undefined,
      max < absoluteMax ? max : undefined,
    );
    setOpen(false);
  };

  const handleClear = () => {
    setLocalRange([absoluteMin, absoluteMax]);
    onPriceChange(undefined, undefined);
    setOpen(false);
  };

  const displayLabel = hasActiveFilter
    ? `${formatPrice(minPrice ?? absoluteMin)} - ${formatPrice(maxPrice ?? absoluteMax)}`
    : "Fiyat";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full border-gray-200 bg-white px-4 text-sm font-normal shadow-sm hover:border-gray-300 hover:bg-gray-50",
            hasActiveFilter && "border-gray-900 bg-gray-50 font-medium",
            triggerClassName,
          )}
        >
          {displayLabel}
          <ChevronDown className="size-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Fiyat Aralığı</h4>
            <p className="text-xs text-gray-500">Gecelik fiyat</p>
          </div>

          <div className="px-2 py-4">
            <Slider
              value={localRange}
              min={absoluteMin}
              max={absoluteMax}
              step={100}
              onValueChange={(value) =>
                setLocalRange(value as [number, number])
              }
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-xs text-gray-500">Min</span>
              <p className="font-medium">{formatPrice(localRange[0])}</p>
            </div>
            <span className="text-gray-400">-</span>
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-xs text-gray-500">Max</span>
              <p className="font-medium">{formatPrice(localRange[1])}</p>
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Temizle
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Uygula
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
