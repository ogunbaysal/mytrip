import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      // apiFetch returns the parsed JSON directly usually
      return apiFetch<Record<string, any>>("/api/admin/settings");
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      return apiFetch(`/api/admin/settings/${key}`, {
        method: "PATCH",
        body: JSON.stringify(value),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(`${variables.key} ayarları güncellendi`);
    },
    onError: (error) => {
      toast.error("Ayarlar güncellenirken bir hata oluştu");
      console.error(error);
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth(); // session.user is what we have access to
  
  return useMutation({
    mutationFn: async (data: { name?: string; bio?: string; phone?: string; avatar?: string }) => {
      return apiFetch("/api/admin/settings/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
        toast.success("Profil bilgileri güncellendi");
    },
    onError: (error) => {
      toast.error("Profil güncellenirken bir hata oluştu");
      console.error(error);
    },
  });
}
