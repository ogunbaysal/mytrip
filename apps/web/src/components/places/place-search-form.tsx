import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { format, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchFormSchema, type SearchFormValues } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

type PlaceSearchFormProps = {
  onSubmitSuccess?: () => void;
  className?: string;
};

const LABELS = {
  location: "Yer",
  date: "Tarih",
  guests: "Kişiler",
  stayType: "Konaklama Türü",
  submit: "Arama",
  clear: "Hepsini temizle",
};

export function PlaceSearchForm({
  onSubmitSuccess,
  className,
}: PlaceSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: api.places.listCities,
  });

  const { data: placeTypes } = useQuery({
    queryKey: ["place-types"],
    queryFn: api.places.listPlaceTypes,
  });

  const defaultValues: SearchFormValues = {
    location: searchParams.get("city") || searchParams.get("search") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "1"),
    stayType: (searchParams.get("type") as SearchFormValues["stayType"]) || "all",
  };

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    mode: "onSubmit",
    defaultValues,
  });

  useEffect(() => {
    const newValues: SearchFormValues = {
      location: searchParams.get("city") || searchParams.get("search") || "",
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      guests: parseInt(searchParams.get("guests") || "1"),
      stayType:
        (searchParams.get("type") as SearchFormValues["stayType"]) || "all",
    };
    form.reset(newValues);
  }, [searchParams, form]);

  const checkInValue = form.watch("checkIn");
  const checkOutValue = form.watch("checkOut");
  const guestsValue = form.watch("guests") ?? 1;
  const locationValue = form.watch("location");
  const stayTypeValue = form.watch("stayType");

  useEffect(() => {
    const checkInDate = parseDateOrUndefined(checkInValue);
    const checkOutDate = parseDateOrUndefined(checkOutValue);
    if (checkInDate && checkOutDate && checkOutDate < checkInDate) {
      form.setValue("checkOut", "");
    }
  }, [checkInValue, checkOutValue, form]);

  const handleClear = () => {
    form.reset({
      location: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      stayType: "all",
    });
  };

  const onSubmit = (values: SearchFormValues) => {
    const params = new URLSearchParams();
    if (values.location && values.location !== "all") {
      params.set("city", values.location);
    }
    if (values.checkIn) params.set("checkIn", values.checkIn);
    if (values.checkOut) params.set("checkOut", values.checkOut);
    if (values.guests) params.set("guests", values.guests.toString());
    if (values.stayType && values.stayType !== "all")
      params.set("type", values.stayType);

    router.push(`/places?${params.toString()}`);
    onSubmitSuccess?.();
  };

  const hasActiveFilters =
    Boolean(locationValue) ||
    Boolean(checkInValue) ||
    Boolean(checkOutValue) ||
    guestsValue > 1 ||
    stayTypeValue !== "all";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "flex h-full min-h-0 flex-col rounded-3xl border border-border/60 bg-white p-4",
        className,
      )}
    >
      <div className="space-y-3">
        <FieldCard
          label={LABELS.location}
          icon={MapPin}
          error={form.formState.errors.location?.message}
        >
          <div className="relative">
            <select
              id="location"
              className="w-full appearance-none border-none bg-transparent pr-6 text-base font-medium text-foreground outline-none focus-visible:ring-0"
              {...form.register("location")}
            >
              <option value="">Tümü</option>
              {cities?.map((city) => (
                <option key={city.slug} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FieldCard>

        <FieldCard label={LABELS.stayType} icon={Sparkles}>
          <div className="relative">
            <select
              id="stayType"
              className="w-full appearance-none border-none bg-transparent pr-6 text-base font-medium text-foreground outline-none focus-visible:ring-0"
              {...form.register("stayType")}
            >
              <option value="all">Tümü</option>
              {placeTypes?.map((pt) => (
                <option key={pt.type} value={pt.type}>
                  {pt.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FieldCard>

        <DateRangeField
          label={LABELS.date}
          from={checkInValue}
          to={checkOutValue}
          onChange={(range) => {
            form.setValue("checkIn", range.from ?? "", { shouldValidate: true });
            form.setValue("checkOut", range.to ?? "", { shouldValidate: true });
          }}
          error={
            form.formState.errors.checkIn?.message ||
            form.formState.errors.checkOut?.message
          }
        />

        <Controller
          name="guests"
          control={form.control}
          render={({ field }) => {
            const value = field.value ?? 1;
            return (
              <FieldCard
                label={LABELS.guests}
                icon={Users}
                error={form.formState.errors.guests?.message}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-foreground">
                    {value} misafir
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => field.onChange(Math.max(1, value - 1))}
                      disabled={value <= 1}
                      aria-label="Misafir azalt"
                    >
                      <Minus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => field.onChange(Math.min(20, value + 1))}
                      aria-label="Misafir artır"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </FieldCard>
            );
          }}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-medium text-foreground underline underline-offset-2 disabled:opacity-50"
          disabled={!hasActiveFilters}
        >
          {LABELS.clear}
        </button>
        <Button
          type="submit"
          size="lg"
          className="h-12 min-w-[156px] rounded-xl px-6 text-base font-semibold"
        >
          <Search className="size-4" />
          {LABELS.submit}
        </Button>
      </div>
    </form>
  );
}

type FieldCardProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  error?: string;
};

type DateRangeFieldProps = {
  label: string;
  from?: string | null;
  to?: string | null;
  onChange: (value: { from?: string; to?: string }) => void;
  error?: string;
};

function parseDateOrUndefined(value?: string | null) {
  if (!value) return undefined;
  try {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function formatDateRangeLabel(from?: string | null, to?: string | null) {
  const fromDate = parseDateOrUndefined(from);
  const toDate = parseDateOrUndefined(to);
  if (!fromDate && !toDate) return "Tarih ekleyin";
  if (fromDate && !toDate) return `${format(fromDate, "d MMM", { locale: tr })}`;
  if (fromDate && toDate) {
    return `${format(fromDate, "d MMM", { locale: tr })} - ${format(toDate, "d MMM", { locale: tr })}`;
  }
  return "Tarih ekleyin";
}

function DateRangeField({ label, from, to, onChange, error }: DateRangeFieldProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const fromDate = parseDateOrUndefined(from);
  const toDate = parseDateOrUndefined(to);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <FieldCard label={label} icon={CalendarDays} error={error}>
        <div className="text-base font-medium text-muted-foreground">
          {formatDateRangeLabel(from, to)}
        </div>
      </FieldCard>
    );
  }

  return (
    <FieldCard label={label} icon={CalendarDays} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between text-left text-base font-medium",
              !fromDate && !toDate && "text-muted-foreground",
            )}
          >
            <span>{formatDateRangeLabel(from, to)}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-[10050] w-auto max-w-[92vw] p-0"
          side="bottom"
        >
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={
              fromDate || toDate
                ? ({ from: fromDate, to: toDate } as DateRange)
                : undefined
            }
            onSelect={(range) => {
              onChange({
                from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
              });
            }}
            fromDate={new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FieldCard>
  );
}

function FieldCard({ label, icon: Icon, children, error }: FieldCardProps) {
  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Icon className="size-4 text-primary" />
          <span>{label}</span>
        </div>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
