"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function usePlaces() {
  return useQuery({
    queryKey: ["places", "all"],
    queryFn: () => api.places.listAll(),
  });
}
