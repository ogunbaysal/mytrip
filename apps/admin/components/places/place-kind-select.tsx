"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceKind } from "@/hooks/use-places";
import { getPlaceKindLabel } from "./place-kind";

type PlaceKindSelectProps = {
  value?: string;
  onValueChange: (value: string) => void;
  kinds?: PlaceKind[];
  placeholder?: string;
  disabled?: boolean;
  includeUnknownValue?: boolean;
  unknownLabel?: string;
};

export function PlaceKindSelect({
  value,
  onValueChange,
  kinds,
  placeholder = "Yer türü seçin",
  disabled,
  includeUnknownValue = false,
  unknownLabel = "Mevcut Tür",
}: PlaceKindSelectProps) {
  const hasCurrentValue = Boolean(value);
  const hasValueInOptions = Boolean(
    value && kinds?.some((kind) => kind.id === value),
  );

  return (
    <Select
      value={value || ""}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hasCurrentValue && includeUnknownValue && !hasValueInOptions ? (
          <SelectItem value={value!}>
            {unknownLabel}
          </SelectItem>
        ) : null}
        {(kinds ?? []).map((kind) => (
          <SelectItem key={kind.id} value={kind.id}>
            {getPlaceKindLabel(kind.id, kind.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
