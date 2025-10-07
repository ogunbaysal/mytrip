"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

const DEFAULT_LOCALE = "tr";

export function useFeaturedPlaces() {
  return useQuery({
    queryKey: ["places", "featured", DEFAULT_LOCALE],
    queryFn: () => api.places.listFeatured(),
  });
}

export function useFeaturedCollections() {
  return useQuery({
    queryKey: ["collections", "featured", DEFAULT_LOCALE],
    queryFn: () => api.collections.listFeatured(),
  });
}
