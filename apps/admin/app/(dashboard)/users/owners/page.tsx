"use client"

import { UsersTable } from "@/components/tables/users-table"
import { useUsers } from "@/hooks/use-users"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function UsersOwnersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useUsers({
    page: page.toString(),
    limit: "10",
    role: "owner",
    search
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mekan Sahipleri</h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="İsim veya email ara..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <UsersTable data={data?.users || []} isLoading={isLoading} />
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
           Toplam {data?.pagination.total || 0} kullanıcı
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!data || page >= data.pagination.totalPages || isLoading}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}