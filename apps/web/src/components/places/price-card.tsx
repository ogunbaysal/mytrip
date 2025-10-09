"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

interface PriceCardProps {
  nightlyPrice: number;
  checkInInfo?: string;
  totalNights?: number;
}

export function PriceCard({ nightlyPrice, checkInInfo, totalNights = 3 }: PriceCardProps) {
  const [nights, setNights] = useState(totalNights);
  const totalPrice = nightlyPrice * nights;
  const serviceFee = Math.round(totalPrice * 0.12); // 12% service fee
  const taxes = Math.round(totalPrice * 0.08); // 8% taxes
  const finalTotal = totalPrice + serviceFee + taxes;

  return (
    <Card className="border border-border bg-white/90 p-6 shadow-sm shadow-black/5">
      <div className="space-y-6">
        {/* Price Header */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{priceFormatter.format(nightlyPrice)}</span>
          <span className="text-sm text-muted-foreground">gece</span>
        </div>

        {/* Check-in Info */}
        {checkInInfo && (
          <div className="text-sm text-muted-foreground">
            {checkInInfo}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex justify-between text-sm">
            <span>{priceFormatter.format(nightlyPrice)} x {nights} gece</span>
            <span>{priceFormatter.format(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Hizmet bedeli</span>
            <span>{priceFormatter.format(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Vergiler ve ücretler</span>
            <span>{priceFormatter.format(taxes)}</span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span>{priceFormatter.format(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Reserve Button */}
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Rezervasyon yap
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Henüz ücretlendirilmeyeceksiniz
        </p>
      </div>
    </Card>
  );
}