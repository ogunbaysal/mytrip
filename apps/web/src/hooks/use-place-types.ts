"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Konaklama",
  restaurant: "Restoran",
  cafe: "Kafe",
  activity: "Aktivite",
  attraction: "Gezi Yeri",
  transport: "Ulaşım",
};

type PlaceTypeOption = {
  type: string;
  name: string;
  count: number;
};

export function usePlaceTypes() {
  return useQuery<PlaceTypeOption[]>({
    queryKey: ["places", "type-options"],
    queryFn: async () => {
      const items = await api.places.listPlaceTypes();
      return items.map((item) => ({
        type: item.type,
        name: TYPE_LABELS[item.type] ?? item.name,
        count: item.count ?? 0,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
}

