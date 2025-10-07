"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { format, isValid, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { STAY_TYPES, useAppStore } from "@/stores/app-store";
import { searchFormSchema, type SearchFormValues } from "@/lib/validations";
import { cn } from "@/lib/utils";

const LABELS = {
  location: "Lokasyon",
  checkIn: "Giriş",
  checkOut: "Çıkış",
  guests: "Misafir",
  stayType: "Deneyim",
  submit: "Ara",
};

const STAY_TYPE_LABELS: Record<(typeof STAY_TYPES)[number], string> = {
  all: "Tümü",
  stay: "Konaklama",
  experience: "Deneyim",
  restaurant: "Yeme-içme",
};

export function PlaceSearchForm() {
  const { searchFilters, setSearchFilters } = useAppStore((state) => ({
    searchFilters: state.searchFilters,
    setSearchFilters: state.setSearchFilters,
  }));

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    mode: "onSubmit",
    defaultValues: searchFilters,
  });

  const checkInValue = form.watch("checkIn");

  useEffect(() => {
    const checkInDate = parseDateOrUndefined(checkInValue);
    const checkOutValue = form.getValues("checkOut");
    const checkOutDate = parseDateOrUndefined(checkOutValue);

    if (checkInDate && checkOutDate && checkOutDate < checkInDate) {
      form.setValue("checkOut", "");
    }
  }, [checkInValue, form]);

  useEffect(() => {
    form.reset(searchFilters);
  }, [form, searchFilters]);

  const onSubmit = (values: SearchFormValues) => {
    setSearchFilters(values);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full gap-3 rounded-[32px] border border-border/50 bg-white/90 p-4 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:gap-4 lg:p-6"
    >
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <FieldGroup
          label={LABELS.location}
          icon={MapPin}
          error={form.formState.errors.location?.message}
        >
          <Input
            id="location"
            placeholder="Örn. Bodrum"
            {...form.register("location")}
            className="h-auto border-none bg-transparent p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:outline-none"
          />
        </FieldGroup>

        <FieldGroup label={LABELS.stayType} icon={Sparkles}>
          <div className="relative">
            <select
              id="stayType"
              className="w-full appearance-none border-none bg-transparent pr-6 text-sm font-medium text-foreground outline-none focus-visible:ring-0"
              {...form.register("stayType")}
            >
              {STAY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {STAY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FieldGroup>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Controller
          name="checkIn"
          control={form.control}
          render={({ field }) => (
            <FieldGroup
              label={LABELS.checkIn}
              icon={CalendarDays}
              error={form.formState.errors.checkIn?.message}
            >
              <DatePickerField
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                placeholder="dd.mm.yyyy"
                fromDate={new Date()}
              />
            </FieldGroup>
          )}
        />

        <Controller
          name="checkOut"
          control={form.control}
          render={({ field }) => (
            <FieldGroup
              label={LABELS.checkOut}
              icon={CalendarDays}
              error={form.formState.errors.checkOut?.message}
            >
              <DatePickerField
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                placeholder="dd.mm.yyyy"
                fromDate={parseDateOrUndefined(checkInValue)}
              />
            </FieldGroup>
          )}
        />

        <FieldGroup
          label={LABELS.guests}
          icon={Users}
          error={form.formState.errors.guests?.message}
        >
          <Input
            id="guests"
            type="number"
            min={1}
            {...form.register("guests", { valueAsNumber: true })}
            className="h-auto border-none bg-transparent p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:outline-none"
          />
        </FieldGroup>
      </div>

      <Button
        type="submit"
        size="lg"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold sm:w-auto"
      >
        <Search className="size-4" />
        {LABELS.submit}
      </Button>
    </form>
  );
}

type FieldGroupProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  error?: string;
};

type DatePickerFieldProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  fromDate?: Date;
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

function DatePickerField({ value, onChange, placeholder, fromDate }: DatePickerFieldProps) {
  const selectedDate = parseDateOrUndefined(value);
  const displayLabel = selectedDate ? format(selectedDate, "dd.MM.yyyy") : placeholder;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="text-sm font-medium text-muted-foreground">
        {displayLabel}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between text-left text-sm font-medium", 
            !selectedDate && "text-muted-foreground",
          )}
        >
          <span>{displayLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" side="bottom">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : null)}
          fromDate={fromDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function FieldGroup({ label, icon: Icon, children, error }: FieldGroupProps) {
  return (
    <div className="min-w-0 w-full">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-inner transition focus-within:border-primary/40 focus-within:shadow-md">
        <Icon className="size-4 text-primary" />
        <div className="flex flex-1 flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
          {children}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
