"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Eye, Edit, MapPin, Star, Ban, Check, Camera } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Place, mockPlaces, placeTypes, placeStatuses, priceLevels } from "@/lib/mock-data/places"

export function PlacesTable() {
  const router = useRouter()
  const [data, setData] = React.useState<Place[]>(mockPlaces)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handlePlaceAction = (action: string, place: Place) => {
    switch (action) {
      case "view":
        router.push(`/places/${place.id}`)
        break
      case "edit":
        router.push(`/places/${place.id}/edit`)
        break
      case "toggle_featured":
        setData(prev =>
          prev.map(p => p.id === place.id ? { ...p, featured: !p.featured } : p)
        )
        toast.success(`Mekan ${place.featured ? 'öne çıkarılmaktan kaldırıldı' : 'öne çıkarıldı'}: ${place.name}`)
        break
      case "verify":
        if (place.verified) {
          toast.info(`Mekan zaten doğrulanmış: ${place.name}`)
        } else {
          setData(prev =>
            prev.map(p => p.id === place.id ? { ...p, verified: true } : p)
          )
          toast.success(`Mekan doğrulandı: ${place.name}`)
        }
        break
      case "suspend":
        if (place.status === "suspended") {
          toast.info(`Mekan zaten askıya alınmış: ${place.name}`)
        } else {
          setData(prev =>
            prev.map(p => p.id === place.id ? { ...p, status: "suspended" as const } : p)
          )
          toast.success(`Mekan askıya alındı: ${place.name}`)
        }
        break
      case "activate":
        if (place.status === "active") {
          toast.info(`Mekan zaten aktif: ${place.name}`)
        } else {
          setData(prev =>
            prev.map(p => p.id === place.id ? { ...p, status: "active" as const } : p)
          )
          toast.success(`Mekan aktif edildi: ${place.name}`)
        }
        break
    }
  }

  const getTypeLabel = (type: string) => {
    const option = placeTypes.find(opt => opt.value === type)
    return option?.label || type
  }

  const getStatusLabel = (status: string) => {
    const option = placeStatuses.find(opt => opt.value === status)
    return option?.label || status
  }

  const getPriceLevelLabel = (level: string) => {
    const option = priceLevels.find(opt => opt.value === level)
    return option?.label || level
  }

  const getPriceLevelColor = (level: string) => {
    switch (level) {
      case "budget": return "text-green-600"
      case "moderate": return "text-blue-600"
      case "expensive": return "text-orange-600"
      case "luxury": return "text-purple-600"
      default: return "text-gray-600"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "inactive": return "secondary"
      case "pending": return "outline"
      case "suspended": return "destructive"
      default: return "outline"
    }
  }

  const columns: ColumnDef<Place>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tümünü seç"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Satır seç"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Mekan
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const place = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{place.name}</span>
              {place.verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Doğrulanmış
                </Badge>
              )}
              {place.featured && (
                <Badge variant="default" className="text-xs bg-yellow-500 text-black">
                  ⭐ Öne Çıkan
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {place.category} • {place.district}, {place.city}
            </div>
            <div className="text-xs text-muted-foreground">
              Sahip: {place.ownerName}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Tür",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge variant="outline">
            {getTypeLabel(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Değerlendirme
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number
        const reviewCount = row.original.reviewCount
        return (
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        )
      },
    },
    {
      accessorKey: "priceLevel",
      header: "Fiyat",
      cell: ({ row }) => {
        const level = row.getValue("priceLevel") as string
        return (
          <span className={`font-medium ${getPriceLevelColor(level)}`}>
            {getPriceLevelLabel(level)}
          </span>
        )
      },
    },
    {
      accessorKey: "views",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Görüntülenme
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const views = row.getValue("views") as number
        const bookingCount = row.original.bookingCount
        return (
          <div className="space-y-1">
            <div className="font-medium">{views.toLocaleString("tr-TR")}</div>
            {bookingCount && (
              <div className="text-xs text-muted-foreground">
                {bookingCount} rezervasyon
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "contact.phone",
      header: "İletişim",
      cell: ({ row }) => {
        const place = row.original
        return (
          <div className="space-y-1 text-sm">
            {place.contact.phone && (
              <div>{place.contact.phone}</div>
            )}
            {place.contact.email && (
              <div className="text-muted-foreground">{place.contact.email}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Kayıt Tarihi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date
        return date.toLocaleDateString("tr-TR")
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const place = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menüyü aç</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handlePlaceAction("view", place)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePlaceAction("edit", place)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlePlaceAction("toggle_featured", place)}
                className="cursor-pointer"
              >
                <Star className="mr-2 h-4 w-4" />
                {place.featured ? "Öne Çıkarımdan Kaldır" : "Öne Çıkar"}
              </DropdownMenuItem>
              {!place.verified && (
                <DropdownMenuItem
                  onClick={() => handlePlaceAction("verify", place)}
                  className="cursor-pointer text-green-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Doğrula
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {place.status === "active" ? (
                <DropdownMenuItem
                  onClick={() => handlePlaceAction("suspend", place)}
                  className="cursor-pointer text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Askıya Al
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handlePlaceAction("activate", place)}
                  className="cursor-pointer text-green-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aktif Et
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Card Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mekan Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm mekanları görüntüleyin ve yönetin. Toplam {data.length} mekan bulunmaktadır.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Harita Görünümü
              </Button>
              <Button asChild>
                <Link href="/places/create">Mekan Ekle</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mekan ara..."
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("name")?.setFilterValue(event.target.value)
                  }
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Sütunlar <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id === "name" ? "Mekan" :
                         column.id === "type" ? "Tür" :
                         column.id === "status" ? "Durum" :
                         column.id === "rating" ? "Değerlendirme" :
                         column.id === "priceLevel" ? "Fiyat" :
                         column.id === "views" ? "Görüntülenme" :
                         column.id === "contact.phone" ? "İletişim" :
                         column.id === "createdAt" ? "Kayıt Tarihi" :
                         column.id === "actions" ? "İşlemler" :
                         column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Selected Actions */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center space-x-2 py-2">
              <span className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} mekan seçildi
              </span>
              <Button variant="outline" size="sm">
                Toplu İşlemler
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>
                {table.getFilteredSelectedRowModel().rows.length} /{" "}
                {table.getFilteredRowModel().rows.length} mekan seçildi
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}