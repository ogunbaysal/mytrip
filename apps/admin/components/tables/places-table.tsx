"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Edit, Star, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Place } from "@/hooks/use-places"
import { useDeletePlace, useTogglePlaceFeature, useTogglePlaceVerify, useUpdatePlaceStatus } from "@/hooks/use-places"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const PLACE_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restoran",
  hotel: "Otel",
  activity: "Aktivite",
  attraction: "Gezilecek Yer",
  service: "Hizmet",
  shopping: "Mağaza",
  cafe: "Kafe",
}

const PLACE_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  inactive: "Pasif",
  pending: "Beklemede",
  suspended: "Askıda",
  rejected: "Reddedildi",
}

const PRICE_LEVEL_LABELS: Record<string, string> = {
  budget: "Uygun",
  moderate: "Orta",
  expensive: "Pahalı",
  luxury: "Lüks",
}

const getTypeLabel = (type: string) => {
  return PLACE_TYPE_LABELS[type] || type
}

const getStatusLabel = (status: string) => {
  return PLACE_STATUS_LABELS[status] || status
}

const getPriceLevelLabel = (level: string) => {
  return PRICE_LEVEL_LABELS[level] || level
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

// Separate ActionsCell component to handle hooks properly for each row
const ActionsCell = ({ place }: { place: Place }) => {
  const router = useRouter()
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  
  const { mutateAsync: updatePlaceStatus, isPending: isUpdatingStatus } =
    useUpdatePlaceStatus()
  const { mutateAsync: toggleVerify, isPending: isTogglingVerify } =
    useTogglePlaceVerify()
  const { mutateAsync: toggleFeature, isPending: isTogglingFeature } =
    useTogglePlaceFeature()
  const { mutateAsync: deletePlace, isPending: isDeleting } = useDeletePlace()

  const isActionPending =
    isUpdatingStatus || isTogglingVerify || isTogglingFeature || isDeleting

  const runAction = async (
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "İşlem sırasında hata oluştu"
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) {
      return
    }

    try {
      await deletePlace(deleteId)
      setDeleteId(null)
      toast.success("Mekan başarıyla silindi")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Silme işlemi başarısız"
      toast.error(message)
    }
  }

  return (
    <>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu mekanı silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/places/${place.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> Detayları Gör
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/places/${place.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {place.status !== "active" && (
            <DropdownMenuItem
              disabled={isActionPending}
              onClick={() =>
                runAction(
                  () =>
                    updatePlaceStatus({ placeId: place.id, status: "active" }),
                  "Mekan aktifleştirildi",
                )
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Aktifleştir
            </DropdownMenuItem>
          )}
          {place.status === "active" && (
            <DropdownMenuItem
              disabled={isActionPending}
              onClick={() =>
                runAction(
                  () =>
                    updatePlaceStatus({ placeId: place.id, status: "suspended" }),
                  "Mekan askıya alındı",
                )
              }
            >
              <XCircle className="mr-2 h-4 w-4 text-orange-600" /> Askıya Al
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isActionPending}
            onClick={() =>
              runAction(
                () =>
                  toggleVerify({
                    placeId: place.id,
                    verified: !place.verified,
                  }),
                place.verified ? "Doğrulama kaldırıldı" : "Mekan doğrulandı",
              )
            }
          >
            {place.verified ? "Doğrulamayı Kaldır" : "Doğrula"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isActionPending}
            onClick={() =>
              runAction(
                () => toggleFeature(place.id),
                place.featured
                  ? "Öne çıkarılanlardan kaldırıldı"
                  : "Mekan öne çıkarıldı",
              )
            }
          >
            {place.featured ? "Öne Çıkarılanlardan Kaldır" : "Öne Çıkar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            disabled={isActionPending}
            onClick={() => setDeleteId(place.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export function PlacesTable({ data, isLoading }: { data: Place[], isLoading: boolean }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

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
            <span className="font-medium">{Number(rating || 0).toFixed(1)}</span>
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
            title="Görüntülenme Sayısı"
          >
            <Eye className="h-4 w-4" />
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const views = row.getValue("views") as number
        return (
          <div className="font-medium">
            {views.toLocaleString()}
          </div>
        )
      },
    },
    {
      accessorKey: "contactInfo",
      header: "İletişim",
      cell: ({ row }) => {
        const place = row.original
        let contact = place.contactInfo;
        if (typeof contact === 'string') {
            try {
                contact = JSON.parse(contact);
            } catch {
                contact = {};
            }
        }
        return (
          <div className="space-y-1 text-sm">
            {contact?.phone && (
              <div>{contact.phone}</div>
            )}
            {contact?.email && (
              <div className="text-muted-foreground">{contact.email}</div>
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
        const dateStr = row.getValue("createdAt") as string
        const date = new Date(dateStr)
        return date.toLocaleDateString("tr-TR")
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => <ActionsCell place={row.original} />,
    },
  ]

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="flex items-center space-x-2 py-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-end py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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
                         column.id === "ownerName" ? "Mekan Sahibi" :
                         column.id === "category" ? "Kategori" :
                         column.id === "flags" ? "Özellikler" :
                         column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {table.getSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getSelectedRowModel().rows.length} /{" "}
              {table.getRowModel().rows.length} mekan seçildi
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
