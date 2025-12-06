import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type OverviewData = {
  users: { total: number; new: number; active: number };
  places: { total: number; active: number; new: number; totalViews: number; verified: number };
  bookings: { total: number; new: number; confirmed: number; totalRevenue: number; recentRevenue: number };
  reviews: { total: number; new: number; averageRating: number; published: number };
  events: { total: number; recent: number; pageViews: number; searches: number; bookings: number };
};

type EventData = {
  id: string;
  eventType: string;
  userId: string;
  placeId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useAnalyticsOverview(period: string = "30") {
  return useQuery({
    queryKey: ["analytics", "overview", period],
    queryFn: async () => {
      const response = await apiFetch<{ overview: OverviewData }>(`/api/admin/analytics/overview?period=${period}`);
      return response.overview;
    },
  });
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ["analytics", "events", limit],
    queryFn: async () => {
      const response = await apiFetch<{ events: EventData[]; pagination: PaginationData }>(`/api/admin/analytics/events?limit=${limit}&sortBy=createdAt&sortOrder=desc`);
      return response.events;
    },
  });
}
