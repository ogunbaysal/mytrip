"use client"

import { PlacesTable } from "@/components/tables/places-table"
import { usePlaces } from "@/hooks/use-places"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function PlacesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")

  const { data, isLoading } = usePlaces({
    page: page.toString(),
    limit: "10",
    search,
    type,
    status
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mekanlar</h2>
        <div className="flex items-center space-x-2">
           <Button asChild>
              <Link href="/places/create">
                 <Plus className="mr-2 h-4 w-4" /> Yeni Mekan Ekle
              </Link>
           </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Mekan ara..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={type} onValueChange={(v) => setType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="Tip Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tipler</SelectItem>
            <SelectItem value="hotel">Otel / Konaklama</SelectItem>
            <SelectItem value="restaurant">Restoran</SelectItem>
            <SelectItem value="activity">Aktivite</SelectItem>
            <SelectItem value="historical">Tarihi Yer</SelectItem>
            <SelectItem value="museum">Müze</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="Durum Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="pending">Beklemede</SelectItem>
            <SelectItem value="suspended">Askıya Alınmış</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {(search || type || status) && (
           <Button 
             variant="ghost" 
             onClick={() => { setSearch(""); setType(""); setStatus(""); }}
           >
             Sıfırla
           </Button>
        )}
      </div>

      <PlacesTable data={data?.places || []} isLoading={isLoading} />
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
           Toplam {data?.pagination.total || 0} mekan
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