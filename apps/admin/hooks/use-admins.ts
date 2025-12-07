import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type Admin = {
  id: string;
  name: string;
  email: string; // email is unique
  role: string; // Role name (e.g., "Super Admin")
  roleId: string;
  status: "active" | "suspended" | "pending"; // Assuming these link to enums
  createdAt: string;
  lastLoginAt: string | null;
};

type AdminsResponse = {
  admins: Admin[];
};

export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      return apiFetch<AdminsResponse>(`/api/admin/auth/admins`).then(res => res.admins);
    },
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adminData: { name: string; email: string; password: string; roleId: string }) => {
      return apiFetch(`/api/admin/auth/admins`, {
        method: "POST",
        body: JSON.stringify(adminData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}
