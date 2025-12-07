"use client"

import { AdminForm } from "@/components/forms/admin-form"
import { useCreateAdmin } from "@/hooks/use-admins"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function CreateAdminPage() {
  const { mutate: createAdmin, isPending } = useCreateAdmin()
  const router = useRouter()

  const onSubmit = (data: any) => {
    createAdmin(data, {
      onSuccess: () => {
        toast.success("Yönetici başarıyla oluşturuldu")
        router.push("/admins")
      },
      onError: (error) => {
        console.error(error);
        toast.error("Yönetici oluşturulurken bir hata oluştu")
      }
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Yeni Yönetici Oluştur</h2>
      </div>
      <div className="space-y-4">
        <AdminForm onSubmit={onSubmit} isLoading={isPending} />
      </div>
    </div>
  )
}
