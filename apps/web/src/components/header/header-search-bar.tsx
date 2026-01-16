"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { GuestSelector } from "./guest-selector";

interface HeaderSearchBarProps {
  className?: string;
  onSearch?: () => void;
}

export function HeaderSearchBar({ className, onSearch }: HeaderSearchBarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [location, setLocation] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);

  // Popover states
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch cities
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: api.places.listCities,
    enabled: mounted,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (location) {
      params.set("city", location);
    }
    if (dateRange?.from) {
      params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    }
    if (guests > 1) {
      params.set("guests", guests.toString());
    }

    const queryString = params.toString();
    const url = `/places${queryString ? `?${queryString}` : ""}` as Route;
    router.push(url);
    onSearch?.();
  };

  const handleLocationSelect = (cityName: string) => {
    setLocation(cityName);
    setLocationOpen(false);
    // Auto-open date picker after selecting location
    setTimeout(() => setDateOpen(true), 150);
  };

  // Format date range for display
  const formatDateDisplay = () => {
    if (!dateRange?.from) return "Tarih ekle";

    if (dateRange.to) {
      const fromDay = format(dateRange.from, "d", { locale: tr });
      const toDay = format(dateRange.to, "d", { locale: tr });
      const month = format(dateRange.to, "MMM", { locale: tr });
      return `${fromDay}-${toDay} ${month}`;
    }

    return format(dateRange.from, "d MMM", { locale: tr });
  };

  const locationDisplay = location || "Nereye?";
  const guestsDisplay = guests === 1 ? "1 misafir" : `${guests} misafir`;

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-12 items-center rounded-full border border-gray-200 bg-white px-2 shadow-md",
          className,
        )}
      >
        <div className="flex items-center gap-4 px-4">
          <span className="text-sm font-medium text-muted-foreground">
            Yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-12 items-center rounded-full border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg",
        className,
      )}
    >
      {/* Location Section */}
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center rounded-full px-6 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
              location ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {locationDisplay}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <div className="space-y-1">
            <button
              type="button"
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100",
                !location && "bg-gray-100 font-medium",
              )}
              onClick={() => handleLocationSelect("")}
            >
              Tüm lokasyonlar
            </button>
            {cities?.map((city) => (
              <button
                type="button"
                key={city.slug}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100",
                  location === city.name && "bg-gray-100 font-medium",
                )}
                onClick={() => handleLocationSelect(city.name)}
              >
                {city.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" aria-hidden />

      {/* Date Section */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center rounded-full px-6 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
              dateRange?.from ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatDateDisplay()}
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0" sideOffset={8}>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            fromDate={new Date()}
            className="p-3"
          />
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" aria-hidden />

      {/* Guests Section */}
      <GuestSelector
        value={guests}
        onChange={setGuests}
        className="rounded-full"
      />

      {/* Search Button */}
      <button
        type="submit"
        className="m-2 flex size-8 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 active:scale-95"
        aria-label="Ara"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
