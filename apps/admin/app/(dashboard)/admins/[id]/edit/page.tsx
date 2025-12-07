"use client"

import { AdminForm } from "@/components/forms/admin-form"
import { useAdmin, useUpdateAdmin } from "@/hooks/use-admins"
import { useRouter } from "next/navigation"
import { use } from "react"

export default function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  // Fix: Params is a Promise in Next.js 15+ (or can be awaited). 
  // Assuming standard Next.js 14 behavior where it's not a promise, OR handling it if it is.
  // Actually, safe way is to unwrap if needed, but standard params usage:
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { data: admin, isLoading: isLoadingAdmin } = useAdmin(id)
  const { mutate: updateAdmin, isPending: isUpdating } = useUpdateAdmin()
  const router = useRouter()

  const onSubmit = (data: any) => {
    updateAdmin({ id, data }, {
      onSuccess: () => {
        router.push("/admins")
      },
      onError: (error) => {
        console.error(error)
      }
    })
  }

  if (isLoadingAdmin) {
     return <div>Yükleniyor...</div>
  }

  if (!admin) {
      return <div>Yönetici bulunamadı.</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Yönetici Düzenle</h2>
      </div>
      <div className="space-y-4">
        <AdminForm 
            initialData={admin} 
            onSubmit={onSubmit} 
            isLoading={isUpdating} 
            isEdit 
        />
      </div>
    </div>
  )
}
