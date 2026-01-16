"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type Amenity = {
  key: string;
  label: string;
  count: number;
};

export function useAmenities() {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: () => api.places.listAmenities(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
