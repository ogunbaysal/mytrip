"use client";

import { useState, useMemo } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Star, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

interface PlaceDetailBookingCardProps {
  nightlyPrice: number;
  rating: number;
  reviewCount: number;
  maxGuests?: number;
  cleaningFee?: number;
  serviceFeeRate?: number;
}

export function PlaceDetailBookingCard({
  nightlyPrice,
  rating,
  reviewCount,
  maxGuests = 4,
  cleaningFee = 500,
  serviceFeeRate = 0.14,
}: PlaceDetailBookingCardProps) {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const totalGuests = guests.adults + guests.children;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const priceBreakdown = useMemo(() => {
    if (nights <= 0) return null;

    const nightlyTotal = nightlyPrice * nights;
    const weeklyDiscount = nights >= 7 ? Math.round(nightlyTotal * 0.1) : 0;
    const serviceFee = Math.round(
      (nightlyTotal - weeklyDiscount + cleaningFee) * serviceFeeRate,
    );
    const total = nightlyTotal - weeklyDiscount + cleaningFee + serviceFee;

    return {
      nightlyTotal,
      weeklyDiscount,
      cleaningFee,
      serviceFee,
      total,
    };
  }, [nights, nightlyPrice, cleaningFee, serviceFeeRate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!selectingCheckOut) {
      setCheckIn(date);
      setCheckOut(undefined);
      setSelectingCheckOut(true);
    } else {
      if (checkIn && date > checkIn) {
        setCheckOut(date);
        setSelectingCheckOut(false);
        setIsDatePopoverOpen(false);
      } else {
        setCheckIn(date);
        setCheckOut(undefined);
      }
    }
  };

  const handleGuestChange = (
    type: "adults" | "children" | "infants",
    delta: number,
  ) => {
    setGuests((prev) => {
      const newValue = prev[type] + delta;
      if (type === "adults" && newValue < 1) return prev;
      if (newValue < 0) return prev;
      if (type !== "infants" && prev.adults + prev.children + delta > maxGuests)
        return prev;
      return { ...prev, [type]: newValue };
    });
  };

  const formatDateRange = () => {
    if (!checkIn) return "Tarih ekle";
    if (!checkOut) return format(checkIn, "d MMM", { locale: tr });
    return `${format(checkIn, "d MMM", { locale: tr })} - ${format(checkOut, "d MMM", { locale: tr })}`;
  };

  return (
    <div className="rounded-xl border bg-background p-6 shadow-xl">
      {/* Price & Rating Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl font-semibold">
            {priceFormatter.format(nightlyPrice)}
          </span>
          <span className="text-muted-foreground"> gece</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-medium">{rating.toFixed(2)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground underline">
            {reviewCount} değerlendirme
          </span>
        </div>
      </div>

      {/* Date & Guest Selection */}
      <div className="mt-6 rounded-lg border">
        {/* Date Selection */}
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="grid w-full grid-cols-2 divide-x text-left"
              onClick={() => {
                setSelectingCheckOut(false);
                setIsDatePopoverOpen(true);
              }}
            >
              <div className="p-3">
                <div className="text-[10px] font-bold uppercase">Giriş</div>
                <div className="text-sm">
                  {checkIn
                    ? format(checkIn, "d MMM yyyy", { locale: tr })
                    : "Tarih ekle"}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[10px] font-bold uppercase">Çikiş</div>
                <div className="text-sm">
                  {checkOut
                    ? format(checkOut, "d MMM yyyy", { locale: tr })
                    : "Tarih ekle"}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium">
                  {!selectingCheckOut
                    ? "Giriş tarihi seçin"
                    : "Çıkış tarihi seçin"}
                </p>
              </div>
              <Calendar
                mode="single"
                selected={selectingCheckOut ? checkOut : checkIn}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;
                  if (selectingCheckOut && checkIn && date <= checkIn)
                    return true;
                  return false;
                }}
                numberOfMonths={2}
                className="rounded-md border-0"
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
              {(checkIn || checkOut) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCheckIn(undefined);
                    setCheckOut(undefined);
                    setSelectingCheckOut(false);
                  }}
                >
                  Tarihleri temizle
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Guest Selection */}
        <Popover open={isGuestPopoverOpen} onOpenChange={setIsGuestPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center justify-between border-t p-3 text-left">
              <div>
                <div className="text-[10px] font-bold uppercase">
                  Misafirler
                </div>
                <div className="text-sm">
                  {totalGuests} misafir
                  {guests.infants > 0 && `, ${guests.infants} bebek`}
                </div>
              </div>
              {isGuestPopoverOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Yetişkinler</p>
                  <p className="text-sm text-muted-foreground">
                    13 yaş ve üzeri
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("adults", -1)}
                    disabled={guests.adults <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center">{guests.adults}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("adults", 1)}
                    disabled={totalGuests >= maxGuests}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Çocuklar</p>
                  <p className="text-sm text-muted-foreground">2-12 yaş</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("children", -1)}
                    disabled={guests.children <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center">{guests.children}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("children", 1)}
                    disabled={totalGuests >= maxGuests}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bebekler</p>
                  <p className="text-sm text-muted-foreground">2 yaş altı</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("infants", -1)}
                    disabled={guests.infants <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center">{guests.infants}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange("infants", 1)}
                    disabled={guests.infants >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Bu konaklama yerine en fazla {maxGuests} misafir (bebek hariç)
                kalabilir.
              </p>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setIsGuestPopoverOpen(false)}
              >
                Kapat
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Reserve Button */}
      <Button
        className="mt-4 w-full bg-gradient-to-r from-rose-500 to-pink-600 py-6 text-base font-semibold hover:from-rose-600 hover:to-pink-700"
        disabled={!checkIn || !checkOut}
      >
        {checkIn && checkOut ? "Rezervasyon yap" : "Tarihleri kontrol et"}
      </Button>

      {/* Notice */}
      {checkIn && checkOut && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Henüz ücretlendirilmeyeceksiniz
        </p>
      )}

      {/* Price Breakdown */}
      {priceBreakdown && (
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="underline">
              {priceFormatter.format(nightlyPrice)} x {nights} gece
            </span>
            <span>{priceFormatter.format(priceBreakdown.nightlyTotal)}</span>
          </div>

          {priceBreakdown.weeklyDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="underline">Haftalık indirim</span>
              <span>
                -{priceFormatter.format(priceBreakdown.weeklyDiscount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="underline">Temizlik ücreti</span>
            <span>{priceFormatter.format(priceBreakdown.cleaningFee)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="underline">Hizmet bedeli</span>
            <span>{priceFormatter.format(priceBreakdown.serviceFee)}</span>
          </div>

          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Toplam</span>
            <span>{priceFormatter.format(priceBreakdown.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
