import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type Place = {
  id: string;
  slug: string;
  name: string;
  type: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  district: string;
  location: any; // JSON
  contactInfo: any; // JSON
  rating: string;
  reviewCount: number;
  priceLevel: string;
  nightlyPrice: string;
  status: "active" | "inactive" | "pending" | "suspended";
  verified: boolean;
  featured: boolean;
  views: number;
  bookingCount: number;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  features: string[];
  openingHours: any;
  checkInInfo: any;
  checkOutInfo: any;
};

type Params = {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  status?: string;
  category?: string;
  featured?: string;
  verified?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type PlacesResponse = {
  places: Place[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PlaceStats = {
  totalPlaces: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  verified: number;
  unverified: number;
  featured: number;
  notFeatured: number;
  recentPlaces: number;
  totalViews: number;
  totalBookings: number;
  averageRating: number;
};

export function usePlaces(params: Params) {
  return useQuery({
    queryKey: ["places", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      return apiFetch<PlacesResponse>(`/api/admin/places?${searchParams.toString()}`);
    },
  });
}

export function usePlace(placeId: string) {
  return useQuery({
    queryKey: ["places", placeId],
    queryFn: async () => {
      return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}`).then(res => res.place);
    },
    enabled: !!placeId,
  });
}

export function usePlaceStats() {
  return useQuery({
    queryKey: ["places", "stats"],
    queryFn: async () => {
      return apiFetch<{ stats: PlaceStats }>(`/api/admin/places/stats`).then(res => res.stats);
    },
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (placeData: any) => {
      return apiFetch<{ place: Place }>(`/api/admin/places`, {
        method: "POST",
        body: JSON.stringify(placeData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ placeId, data }: { placeId: string; data: Partial<Place> }) => {
      return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      queryClient.invalidateQueries({ queryKey: ["places", variables.placeId] });
    },
  });
}

export function useUpdatePlaceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ placeId, status, reason }: { placeId: string; status: string; reason?: string }) => {
      return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      queryClient.invalidateQueries({ queryKey: ["places", variables.placeId] });
    },
  });
}

export function useTogglePlaceFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (placeId: string) => {
      return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}/feature`, {
        method: "PATCH",
      });
    },
    onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["places"] });
        queryClient.invalidateQueries({ queryKey: ["places", variables] });
    },
  });
}

export function useTogglePlaceVerify() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (placeId: string) => {
        return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}/verify`, {
          method: "PATCH",
        });
      },
      onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: ["places"] });
          queryClient.invalidateQueries({ queryKey: ["places", variables] });
      },
    });
}

export function useDeletePlace() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (placeId: string) => {
        return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}`, {
          method: "DELETE",
        });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["places"] });
      },
    });
}
