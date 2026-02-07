"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PlaceSummary } from "@/types";

export type PlaceFilters = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  district?: string;
  type?: string;
  category?: string;
  guests?: number;
  season?: string;
  checkIn?: string;
  checkOut?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  amenities?: string[];
  bounds?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  featured?: boolean;
  verified?: boolean;
};

export type PlaceListResult = {
  places: PlaceSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function usePlaces(filters?: PlaceFilters) {
  return useQuery<PlaceListResult>({
    queryKey: ["places", "all", filters],
    queryFn: () => api.places.listAll(filters),
  });
}
