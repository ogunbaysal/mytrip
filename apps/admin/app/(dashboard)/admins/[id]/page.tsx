"use client"

import { useAdmin } from "@/hooks/use-admins"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { use } from "react"
// import { format } from "date-fns" 

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const { data: admin, isLoading } = useAdmin(id)
  const router = useRouter()

  if (isLoading) return <div>Yükleniyor...</div>
  if (!admin) return <div>Yönetici bulunamadı.</div>

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{admin.name}</h2>
        <Button onClick={() => router.push(`/admins/${id}/edit`)}>Düzenle</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-col space-y-1">
             <span className="text-sm font-medium text-muted-foreground">E-posta</span>
             <span className="text-lg font-bold">{admin.email}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-col space-y-1">
             <span className="text-sm font-medium text-muted-foreground">Rol</span>
             <span className="text-lg font-bold">{admin.role || admin.roleId}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
           <div className="flex flex-col space-y-1">
             <span className="text-sm font-medium text-muted-foreground">Durum</span>
             <span className="text-lg font-bold capitalize">{admin.status}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
           <div className="flex flex-col space-y-1">
             <span className="text-sm font-medium text-muted-foreground">Kayıt Tarihi</span>
             <span className="text-lg font-bold">
                {new Date(admin.createdAt).toLocaleDateString("tr-TR")}
             </span>
          </div>
        </div>
      </div>
    </div>
  )
}
