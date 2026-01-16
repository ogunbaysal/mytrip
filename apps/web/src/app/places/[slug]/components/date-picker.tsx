"use client";

import { useState } from "react";
import { format, differenceInDays, addDays, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface PlaceDetailDatePickerProps {
  city?: string;
  onDateChange?: (
    checkIn: Date | undefined,
    checkOut: Date | undefined,
  ) => void;
}

export function PlaceDetailDatePicker({
  city = "Muğla",
  onDateChange,
}: PlaceDetailDatePickerProps) {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!selectingCheckOut) {
      setCheckIn(date);
      setCheckOut(undefined);
      setSelectingCheckOut(true);
      onDateChange?.(date, undefined);
    } else {
      if (checkIn && date > checkIn) {
        setCheckOut(date);
        setSelectingCheckOut(false);
        onDateChange?.(checkIn, date);
      } else {
        setCheckIn(date);
        setCheckOut(undefined);
        onDateChange?.(date, undefined);
      }
    }
  };

  const handleClearDates = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setSelectingCheckOut(false);
    onDateChange?.(undefined, undefined);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const getDateRangeText = () => {
    if (!checkIn) return "Tarihlerinizi girin";
    if (!checkOut) {
      return format(checkIn, "d MMMM yyyy", { locale: tr });
    }
    return `${format(checkIn, "d MMM", { locale: tr })} - ${format(checkOut, "d MMM yyyy", { locale: tr })}`;
  };

  const isPastMonth = () => {
    const today = new Date();
    return (
      currentMonth.getFullYear() < today.getFullYear() ||
      (currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() <= today.getMonth())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {nights > 0 ? (
          <>
            <h2 className="text-xl font-semibold md:text-2xl">
              {city}&apos;da {nights} gece
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {getDateRangeText()}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold md:text-2xl">
              Tarihlerinizi seçin
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kesin fiyatları görmek için seyahat tarihlerinizi ekleyin
            </p>
          </>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          disabled={isPastMonth()}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Önceki ay</span>
        </Button>
        <div className="flex gap-12 text-sm font-medium">
          <span>{format(currentMonth, "MMMM yyyy", { locale: tr })}</span>
          <span>
            {format(addMonths(currentMonth, 1), "MMMM yyyy", { locale: tr })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Sonraki ay</span>
        </Button>
      </div>

      {/* Two Month Calendar */}
      <div className="grid gap-8 md:grid-cols-2">
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          selected={selectingCheckOut ? checkOut : checkIn}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) return true;
            if (selectingCheckOut && checkIn && date <= checkIn) return true;
            return false;
          }}
          className="w-full"
          showOutsideDays={false}
          modifiers={{
            checkIn: checkIn ? [checkIn] : [],
            checkOut: checkOut ? [checkOut] : [],
            range:
              checkIn && checkOut
                ? Array.from(
                    { length: differenceInDays(checkOut, checkIn) - 1 },
                    (_, i) => addDays(checkIn, i + 1),
                  )
                : [],
          }}
          modifiersStyles={{
            checkIn: {
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "50%",
            },
            checkOut: {
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "50%",
            },
            range: { backgroundColor: "#f3f4f6" },
          }}
        />
        <Calendar
          mode="single"
          month={addMonths(currentMonth, 1)}
          selected={selectingCheckOut ? checkOut : checkIn}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) return true;
            if (selectingCheckOut && checkIn && date <= checkIn) return true;
            return false;
          }}
          className="w-full"
          showOutsideDays={false}
          modifiers={{
            checkIn: checkIn ? [checkIn] : [],
            checkOut: checkOut ? [checkOut] : [],
            range:
              checkIn && checkOut
                ? Array.from(
                    { length: differenceInDays(checkOut, checkIn) - 1 },
                    (_, i) => addDays(checkIn, i + 1),
                  )
                : [],
          }}
          modifiersStyles={{
            checkIn: {
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "50%",
            },
            checkOut: {
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "50%",
            },
            range: { backgroundColor: "#f3f4f6" },
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="font-medium underline"
          onClick={handleClearDates}
          disabled={!checkIn && !checkOut}
        >
          Tarihleri temizle
        </Button>
      </div>
    </div>
  );
}
