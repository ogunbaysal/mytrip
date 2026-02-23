
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryInput = {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await apiFetch<{ categories: Category[] }>("/api/admin/categories");
      return data.categories;
    },
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const data = await apiFetch<{ category: Category }>(`/api/admin/categories/${id}`);
      return data.category;
    },
    enabled: !!id,
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryInput }) => {
      return apiFetch<{ success: true; category: Category }>(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      toast.success("Kategori güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
