"use client"

import { PlacesTable } from "@/components/tables/places-table"
import { usePlaces } from "@/hooks/use-places"
import { useCategories } from "@/hooks/use-categories"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function PlacesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const { data: categories } = useCategories()
  const hasActiveFilters = Boolean(search || category || status)

  const { data, isLoading } = usePlaces({
    page: page.toString(),
    limit: "10",
    search,
    category,
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
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />
        <Select
          value={category || "all"}
          onValueChange={(v) => {
            setCategory(v === "all" ? "" : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
             <SelectValue placeholder="Kategori Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : v)
            setPage(1)
          }}
        >
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
        {hasActiveFilters && (
           <Button 
             variant="ghost" 
             onClick={() => {
               setSearch("")
               setCategory("")
               setStatus("")
               setPage(1)
             }}
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
