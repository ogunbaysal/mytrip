"use client"

import { AdminsTable } from "@/components/tables/admins-table"
import { useAdmins } from "@/hooks/use-admins"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UsersAdminsPage() {
  const router = useRouter()
  const { data: admins, isLoading } = useAdmins();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Yöneticiler</h2>
        <Button onClick={() => router.push("/admins/create")}>
            Yeni Yönetici
        </Button>
      </div>
      <AdminsTable data={admins || []} isLoading={isLoading} />
    </div>
  )
}