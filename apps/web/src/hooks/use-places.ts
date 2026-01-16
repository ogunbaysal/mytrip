"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type PlaceFilters = {
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
};

export function usePlaces(filters?: PlaceFilters) {
  return useQuery({
    queryKey: ["places", "all", filters],
    queryFn: () => api.places.listAll(filters),
  });
}
