"use client";

import { Clock, Info } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlaceKindLabel, isStayPlaceKind } from "@/lib/place-kind";

export const PLACE_FEATURE_OPTIONS = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Otopark" },
  { id: "pool", label: "Havuz" },
  { id: "spa", label: "Spa & Wellness" },
  { id: "restaurant", label: "Restoran" },
  { id: "bar", label: "Bar" },
  { id: "air_conditioning", label: "Klima" },
  { id: "sea_view", label: "Deniz Manzarasi" },
  { id: "beach_access", label: "Plaja Erisim" },
  { id: "family_friendly", label: "Aile Dostu" },
];

type PlaceKindModuleRendererProps = {
  kindId?: string;
  kindName?: string | null;
  supportsRooms?: boolean;
  supportsMenu?: boolean;
  supportsPackages?: boolean;
  features: string[];
  onToggleFeature: (featureId: string) => void;
  checkInInfo?: string;
  checkOutInfo?: string;
  onCheckInInfoChange?: (value: string) => void;
  onCheckOutInfoChange?: (value: string) => void;
};

export function PlaceKindModuleRenderer({
  kindId,
  kindName,
  supportsRooms,
  supportsMenu,
  supportsPackages,
  features,
  onToggleFeature,
  checkInInfo,
  checkOutInfo,
  onCheckInInfoChange,
  onCheckOutInfoChange,
}: PlaceKindModuleRendererProps) {
  const resolvedKindLabel = getPlaceKindLabel(kindName || kindId);
  const showStayTimingFields =
    isStayPlaceKind(kindId) && onCheckInInfoChange && onCheckOutInfoChange;

  return (
    <>
      <DashboardCard padding="md">
        <SectionHeader
          title="Tur Modulleri"
          subtitle={`${resolvedKindLabel} icin aktif moduller`}
          icon={<Info className="size-5" />}
          size="sm"
          className="mb-4"
        />

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              supportsRooms ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            Oda Modulu
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              supportsMenu ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            Menu Modulu
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              supportsPackages ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            Paket Modulu
          </span>
        </div>
      </DashboardCard>

      <DashboardCard padding="md">
        <SectionHeader
          title="Ozellikler"
          subtitle="Mekana ait one cikan ozellikleri isaretleyin"
          icon={<Info className="size-5" />}
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLACE_FEATURE_OPTIONS.map((feature) => {
            const checked = features.includes(feature.id);
            return (
              <label
                key={feature.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleFeature(feature.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{feature.label}</span>
              </label>
            );
          })}
        </div>
      </DashboardCard>

      {showStayTimingFields ? (
        <DashboardCard padding="md">
          <SectionHeader
            title="Konaklama Saatleri"
            subtitle="Otel ve villa turleri icin check-in/check-out alanlari"
            icon={<Clock className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkInInfo">Check-in Bilgisi</Label>
              <Input
                id="checkInInfo"
                value={checkInInfo ?? ""}
                onChange={(event) => onCheckInInfoChange(event.target.value)}
                placeholder="Orn: 14:00 sonrasi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutInfo">Check-out Bilgisi</Label>
              <Input
                id="checkOutInfo"
                value={checkOutInfo ?? ""}
                onChange={(event) => onCheckOutInfoChange(event.target.value)}
                placeholder="Orn: 11:00"
              />
            </div>
          </div>
        </DashboardCard>
      ) : null}
    </>
  );
}
