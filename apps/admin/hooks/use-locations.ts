
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type City = {
  id: string;
  name: string;
};

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const data = await apiFetch<{ cities: City[] }>("/api/locations/cities");
      return data.cities;
    },
  });
}

export function useDistricts(city: string) {
  return useQuery({
    queryKey: ["districts", city],
    queryFn: async () => {
      if (!city) return [];
      const data = await apiFetch<{ districts: string[] }>(`/api/locations/districts/${city}`);
      return data.districts;
    },
    enabled: !!city,
  });
}
