"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { tr } from "date-fns/locale";

interface ReservationCalendarProps {
  onDateChange?: (checkIn: Date | undefined, checkOut: Date | undefined) => void;
}

export function ReservationCalendar({ onDateChange }: ReservationCalendarProps) {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If no check-in date or both dates are set, start fresh with check-in
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(undefined);
      onDateChange?.(date, undefined);
    } 
    // If check-in is set but no check-out, set check-out
    else if (checkIn && !checkOut) {
      if (date > checkIn) {
        setCheckOut(date);
        onDateChange?.(checkIn, date);
        setIsCalendarOpen(false);
      } else {
        // If selected date is before check-in, restart with new check-in
        setCheckIn(date);
        setCheckOut(undefined);
        onDateChange?.(date, undefined);
      }
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "dd MMM", { locale: tr });
  };

  const getNights = () => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <Card className="border border-border bg-white/90 p-6 shadow-sm shadow-black/5">
      <div className="space-y-4">
        {/* Date Selection Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="flex flex-col items-start h-auto p-3 text-left"
            onClick={() => setIsCalendarOpen(true)}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase">Giriş</span>
            <span className="text-sm">
              {checkIn ? formatDate(checkIn) : "Tarih seçin"}
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-start h-auto p-3 text-left"
            onClick={() => setIsCalendarOpen(true)}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase">Çıkış</span>
            <span className="text-sm">
              {checkOut ? formatDate(checkOut) : "Tarih seçin"}
            </span>
          </Button>
        </div>

        {/* Nights Display */}
        {checkIn && checkOut && (
          <div className="text-center text-sm text-muted-foreground">
            {getNights()} gece
          </div>
        )}

        {/* Calendar */}
        {isCalendarOpen && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Tarihlerinizi seçin</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCalendarOpen(false)}
              >
                Kapat
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="w-full"
              modifiers={{
                checkIn: checkIn ? [checkIn] : [],
                checkOut: checkOut ? [checkOut] : [],
                range: checkIn && checkOut ? 
                  Array.from({ length: getNights() - 1 }, (_, i) => 
                    addDays(checkIn, i + 1)
                  ) : [],
              }}
              modifiersStyles={{
                checkIn: { backgroundColor: '#000', color: '#fff' },
                checkOut: { backgroundColor: '#000', color: '#fff' },
                range: { backgroundColor: '#f3f4f6' },
              }}
            />
            <div className="mt-4 text-xs text-muted-foreground">
              {!checkIn && "Giriş tarihinizi seçin"}
              {checkIn && !checkOut && "Çıkış tarihinizi seçin"}
              {checkIn && checkOut && `${getNights()} gece seçildi`}
            </div>
          </div>
        )}

        {/* Clear Dates */}
        {(checkIn || checkOut) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setCheckIn(undefined);
              setCheckOut(undefined);
              onDateChange?.(undefined, undefined);
            }}
          >
            Tarihleri temizle
          </Button>
        )}
      </div>
    </Card>
  );
}