"use client";

import { MapPin } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { CoordinateMapPicker } from "@/components/ui/coordinate-map-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocationOption = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

type PlaceLocationValue = {
  address: string;
  cityId: string;
  districtId: string;
  location: { lat: number; lng: number };
};

type PlaceLocationSectionProps = {
  value: PlaceLocationValue;
  cities: LocationOption[];
  districts: LocationOption[];
  isCitiesLoading?: boolean;
  isDistrictsLoading?: boolean;
  selectedCityFallbackLabel?: string;
  selectedDistrictFallbackLabel?: string;
  onAddressChange: (value: string) => void;
  onCityChange: (cityId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
};

export function PlaceLocationSection({
  value,
  cities,
  districts,
  isCitiesLoading,
  isDistrictsLoading,
  selectedCityFallbackLabel,
  selectedDistrictFallbackLabel,
  onAddressChange,
  onCityChange,
  onDistrictChange,
  onCoordinatesChange,
}: PlaceLocationSectionProps) {
  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Konum Bilgileri"
        subtitle="Il ve ilce secin, haritadan pin birakin"
        icon={<MapPin className="size-5" />}
        size="sm"
        className="mb-6"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">Acik Adres *</Label>
          <textarea
            id="address"
            value={value.address}
            onChange={(event) => onAddressChange(event.target.value)}
            className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Tam adres"
          />
        </div>

        <div className="space-y-2">
          <Label>Sehir *</Label>
          <Select
            value={value.cityId || undefined}
            onValueChange={onCityChange}
            disabled={isCitiesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sehir secin" />
            </SelectTrigger>
            <SelectContent>
              {value.cityId && !cities.some((city) => city.id === value.cityId) ? (
                <SelectItem value={value.cityId}>
                  {selectedCityFallbackLabel || "Secili sehir"}
                </SelectItem>
              ) : null}
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ilce *</Label>
          <Select
            value={value.districtId || undefined}
            onValueChange={onDistrictChange}
            disabled={!value.cityId || isDistrictsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={value.cityId ? "Ilce secin" : "Once sehir secin"} />
            </SelectTrigger>
            <SelectContent>
              {value.districtId &&
              !districts.some((district) => district.id === value.districtId) ? (
                <SelectItem value={value.districtId}>
                  {selectedDistrictFallbackLabel || "Secili ilce"}
                </SelectItem>
              ) : null}
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Haritada konuma tiklayin veya pini surukleyin.
          </p>
          <CoordinateMapPicker
            latitude={value.location.lat}
            longitude={value.location.lng}
            onChange={onCoordinatesChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Enlem</Label>
          <Input value={String(value.location.lat)} readOnly />
        </div>

        <div className="space-y-2">
          <Label>Boylam</Label>
          <Input value={String(value.location.lng)} readOnly />
        </div>
      </div>
    </DashboardCard>
  );
}
