"use client";

import { DollarSign } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStayPlaceKind } from "@/lib/place-kind";

type PlacePricingSectionProps = {
  kindId?: string;
  nightlyPrice: string;
  onNightlyPriceChange: (value: string) => void;
};

export function PlacePricingSection({
  kindId,
  nightlyPrice,
  onNightlyPriceChange,
}: PlacePricingSectionProps) {
  const isStayKind = isStayPlaceKind(kindId);
  const fieldLabel = isStayKind ? "Gecelik Fiyat (₺)" : "Baslangic Fiyat (₺)";

  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Fiyatlandirma"
        subtitle="Fiyat seviyesi API tarafindan otomatik hesaplanir"
        icon={<DollarSign className="size-5" />}
        size="sm"
        className="mb-6"
      />

      <div className="space-y-2">
        <Label htmlFor="nightlyPrice">{fieldLabel}</Label>
        <Input
          id="nightlyPrice"
          type="number"
          min="0"
          step="0.01"
          value={nightlyPrice}
          onChange={(event) => onNightlyPriceChange(event.target.value)}
          placeholder="Orn: 3500"
        />
      </div>
    </DashboardCard>
  );
}
