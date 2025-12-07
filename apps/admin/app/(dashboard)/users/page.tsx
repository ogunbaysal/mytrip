"use client"

import { UsersTable } from "@/components/tables/users-table"
import { useUsers } from "@/hooks/use-users"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")

  const { data, isLoading } = useUsers({
    page: page.toString(),
    limit: "10",
    search,
    role,
    status
  })

  // Debounced search could be implemented here or via a hook, 
  // currently direct state binding will trigger fetch on every keystroke 
  // which might be too aggressive, but acceptable for internal admin initially.

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="İsim veya email ara..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={role} onValueChange={(v) => setRole(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="Rol Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Roller</SelectItem>
            <SelectItem value="admin">Yönetici</SelectItem>
            <SelectItem value="owner">Mekan Sahibi</SelectItem>
            <SelectItem value="traveler">Gezgin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="Durum Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="suspended">Askıya Alınmış</SelectItem>
            <SelectItem value="pending">Beklemede</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {(search || role || status) && (
           <Button 
             variant="ghost" 
             onClick={() => { setSearch(""); setRole(""); setStatus(""); }}
           >
             Sıfırla
           </Button>
        )}
      </div>

      <UsersTable data={data?.users || []} isLoading={isLoading} />
      
      {/* Pagination Controls could be moved to Table or kept here */}
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