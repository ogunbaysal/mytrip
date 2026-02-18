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
  const normalizedValue = value?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const matchedKind = kinds?.find((kind) => {
    const normalizedKindId = kind.id.trim().toLocaleLowerCase("tr-TR");
    const normalizedKindSlug = kind.slug.trim().toLocaleLowerCase("tr-TR");
    const normalizedKindName = kind.name.trim().toLocaleLowerCase("tr-TR");
    return (
      value === kind.id ||
      value === kind.slug ||
      normalizedValue === normalizedKindId ||
      normalizedValue === normalizedKindSlug ||
      normalizedValue === normalizedKindName
    );
  });
  const unresolvedValue =
    value && !matchedKind && includeUnknownValue ? value : undefined;
  const resolvedValue = matchedKind?.id ?? unresolvedValue ?? "";

  return (
    <Select
      value={resolvedValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        {unresolvedValue ? (
          <span className="line-clamp-1">{unknownLabel}</span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {unresolvedValue ? (
          <SelectItem value={resolvedValue}>
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
