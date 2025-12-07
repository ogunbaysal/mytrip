import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "traveler";
  status: "active" | "suspended" | "pending";
  phone: string | null;
  avatar: string | null;
  placeCount: number;
  lastLoginAt: string | null;
  createdAt: string;
};

type Params = {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type UsersResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function useUsers(params: Params) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      return apiFetch<UsersResponse>(`/api/admin/users?${searchParams.toString()}`);
    },
  });
}

type UserStats = {
  totalUsers: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  recentUsers: number;
  usersWithPlaces: number;
};

export function useUserStats() {
  return useQuery({
    queryKey: ["users", "stats"],
    queryFn: async () => {
      return apiFetch<{ stats: UserStats }>(`/api/admin/users/stats`).then(res => res.stats);
    },
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      return apiFetch<{ user: User }>(`/api/admin/users/${userId}`).then(res => res.user);
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: any) => {
      return apiFetch<{ user: User }>(`/api/admin/users`, {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      return apiFetch<{ user: User }>(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
       queryClient.invalidateQueries({ queryKey: ["users"] });
       queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: string; reason?: string }) => {
      return apiFetch<{ user: User }>(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}
