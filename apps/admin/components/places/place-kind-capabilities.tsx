"use client";

import { Badge } from "@/components/ui/badge";
import { PlaceKind } from "@/hooks/use-places";

type PlaceKindCapabilitiesProps = {
  kindId?: string;
  kinds?: PlaceKind[];
};

export function PlaceKindCapabilities({
  kindId,
  kinds,
}: PlaceKindCapabilitiesProps) {
  if (!kindId) return null;

  const selectedKind = kinds?.find((kind) => kind.id === kindId);
  if (!selectedKind) return null;

  const capabilities = [
    {
      key: "rooms",
      label: "Oda Modülü",
      enabled: selectedKind.supportsRooms,
    },
    {
      key: "menu",
      label: "Menü Modülü",
      enabled: selectedKind.supportsMenu,
    },
    {
      key: "packages",
      label: "Paket Modülü",
      enabled: selectedKind.supportsPackages,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {capabilities.map((capability) => (
        <Badge
          key={capability.key}
          variant={capability.enabled ? "default" : "secondary"}
        >
          {capability.label}
        </Badge>
      ))}
    </div>
  );
}
