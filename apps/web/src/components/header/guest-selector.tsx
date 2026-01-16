"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface GuestSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function GuestSelector({
  value,
  onChange,
  min = 1,
  max = 16,
  className,
}: GuestSelectorProps) {
  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const displayText = value === 1 ? "1 misafir" : `${value} misafir`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors rounded-full",
            className,
          )}
        >
          {displayText}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Misafirler</p>
            <p className="text-xs text-muted-foreground">Kaç kişi kalacak?</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={decrement}
              disabled={value <= min}
            >
              <Minus className="size-4" />
              <span className="sr-only">Azalt</span>
            </Button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {value}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={increment}
              disabled={value >= max}
            >
              <Plus className="size-4" />
              <span className="sr-only">Artır</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
