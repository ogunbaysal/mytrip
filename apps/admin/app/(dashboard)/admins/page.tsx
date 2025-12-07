"use client"

import { AdminsTable } from "@/components/tables/admins-table"
import { useAdmins } from "@/hooks/use-admins"

export default function UsersAdminsPage() {
  const { data: admins, isLoading } = useAdmins();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Yöneticiler</h2>
        {/* TODO: Add 'Create Admin' button here linking to a modal or page */}
      </div>
      <AdminsTable data={admins || []} isLoading={isLoading} />
    </div>
  )
}