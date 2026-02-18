import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type JsonObject = Record<string, unknown>;
type ContactInfo = {
  phone?: string;
  email?: string;
  website?: string;
} | null;
export type PlaceKindId =
  | "hotel"
  | "villa"
  | "restaurant"
  | "cafe"
  | "bar_club"
  | "beach"
  | "natural_location"
  | "activity_location"
  | "visit_location"
  | "other_monetized";

export type PlaceKind = {
  id: PlaceKindId;
  slug: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  monetized: boolean;
  supportsRooms: boolean;
  supportsMenu: boolean;
  supportsPackages: boolean;
  sortOrder: number;
  active: boolean;
};

export type PlaceFeatureOption = {
  id: string;
  slug: string;
  label: string;
  count: number;
};

export type Place = {
  id: string;
  slug: string;
  name: string;
  kind: PlaceKindId;
  type?: string;
  category?: string;
  categoryId?: string;
  kindName?: string;
  kindSlug?: string;
  categoryName?: string;
  categorySlug?: string;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  district: string;
  location: JsonObject | string | null;
  contactInfo: ContactInfo;
  rating: string;
  reviewCount: number;
  priceLevel: string;
  nightlyPrice: string;
  status: "active" | "inactive" | "pending" | "suspended" | "rejected";
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
  openingHours: JsonObject | string | null;
  checkInInfo: JsonObject | string | null;
  checkOutInfo: JsonObject | string | null;
  businessDocumentFileId?: string | null;
  businessDocument?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    usage: string;
    uploadedById: string;
    createdAt: string;
  } | null;
};

type Params = {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  kind?: PlaceKindId;
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

export function usePlaceKinds() {
  return useQuery({
    queryKey: ["place-kinds"],
    queryFn: async () => {
      return apiFetch<{ kinds: PlaceKind[] }>(`/api/admin/places/kinds`).then(
        (res) => res.kinds,
      );
    },
  });
}

export function usePlaceFeatures() {
  return useQuery({
    queryKey: ["place-features"],
    queryFn: async () => {
      return apiFetch<{ features: PlaceFeatureOption[] }>(
        `/api/admin/places/features`,
      ).then((res) => res.features);
    },
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (placeData: Record<string, unknown>) => {
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
    mutationFn: async ({
      placeId,
      data,
    }: {
      placeId: string;
      data: Record<string, unknown>;
    }) => {
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
      mutationFn: async (
        payload: string | { placeId: string; verified?: boolean },
      ) => {
        const placeId = typeof payload === "string" ? payload : payload.placeId;
        const verified =
          typeof payload === "string" ? undefined : payload.verified;
        return apiFetch<{ place: Place }>(`/api/admin/places/${placeId}/verify`, {
          method: "PATCH",
          body: JSON.stringify(
            verified === undefined ? {} : { verified },
          ),
        });
      },
      onSuccess: (data, variables) => {
          const placeId = typeof variables === "string" ? variables : variables.placeId;
          queryClient.invalidateQueries({ queryKey: ["places"] });
          queryClient.invalidateQueries({ queryKey: ["places", placeId] });
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
