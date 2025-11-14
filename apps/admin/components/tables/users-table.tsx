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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Eye, Edit, Ban, Check } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, mockUsers, roleOptions, statusOptions } from "@/lib/mock-data/users"

export function UsersTable() {
  const router = useRouter()
  const [data, setData] = React.useState<User[]>(mockUsers)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case "view":
        router.push(`/users/${user.id}`)
        break
      case "edit":
        router.push(`/users/${user.id}/edit`)
        break
      case "suspend":
        if (user.status === "suspended") {
          toast.info(`Kullanıcı zaten askıya alınmış: ${user.name}`)
        } else {
          setData(prev =>
            prev.map(u => u.id === user.id ? { ...u, status: "suspended" as const } : u)
          )
          toast.success(`Kullanıcı askıya alındı: ${user.name}`)
        }
        break
      case "activate":
        if (user.status === "active") {
          toast.info(`Kullanıcı zaten aktif: ${user.name}`)
        } else {
          setData(prev =>
            prev.map(u => u.id === user.id ? { ...u, status: "active" as const } : u)
          )
          toast.success(`Kullanıcı aktif edildi: ${user.name}`)
        }
        break
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "owner":
        return "default"
      case "traveler":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "suspended":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role)
    return option?.label || role
  }

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.label || status
  }

  const columns: ColumnDef<User>[] = [
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
            Kullanıcı
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {getRoleLabel(role)}
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
      accessorKey: "phone",
      header: "Telefon",
      cell: ({ row }) => row.getValue("phone") || "-",
    },
    {
      accessorKey: "placeCount",
      header: "Mekan Sayısı",
      cell: ({ row }) => {
        const count = row.getValue("placeCount") as number
        return count || "-"
      },
    },
    {
      accessorKey: "subscriptionStatus",
      header: "Abonelik",
      cell: ({ row }) => {
        const status = row.getValue("subscriptionStatus") as string
        if (!status) return "-"
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Aktif" : status === "expired" ? "Süresi Doldu" : "İptal"}
          </Badge>
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
      accessorKey: "lastLoginAt",
      header: "Son Giriş",
      cell: ({ row }) => {
        const date = row.getValue("lastLoginAt") as Date | null
        return date ? date.toLocaleString("tr-TR") : "Hiç giriş yapmadı"
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

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
                onClick={() => handleUserAction("view", user)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUserAction("edit", user)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === "active" ? (
                <DropdownMenuItem
                  onClick={() => handleUserAction("suspend", user)}
                  className="cursor-pointer text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Askıya Al
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleUserAction("activate", user)}
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
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin. Toplam {data.length} kullanıcı bulunmaktadır.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button asChild>
                <Link href="/users/create">Kullanıcı Ekle</Link>
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
                  placeholder="Kullanıcı ara..."
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
                        {column.id === "name" ? "Kullanıcı" :
                         column.id === "role" ? "Rol" :
                         column.id === "status" ? "Durum" :
                         column.id === "phone" ? "Telefon" :
                         column.id === "placeCount" ? "Mekan Sayısı" :
                         column.id === "subscriptionStatus" ? "Abonelik" :
                         column.id === "createdAt" ? "Kayıt Tarihi" :
                         column.id === "lastLoginAt" ? "Son Giriş" :
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
                {table.getFilteredSelectedRowModel().rows.length} kullanıcı seçildi
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
                {table.getFilteredRowModel().rows.length} kullanıcı seçildi
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