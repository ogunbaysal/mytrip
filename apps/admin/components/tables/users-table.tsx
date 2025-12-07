"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, useUpdateUserStatus } from "@/hooks/use-users"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UsersTableProps {
  data: User[];
  isLoading: boolean;
}

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState({})
  
  const { mutate: updateStatus } = useUpdateUserStatus()

  // Define columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Kullanıcı",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar || ""} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
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
          <Badge variant={role === "admin" ? "default" : role === "owner" ? "secondary" : "outline"}>
            {role === "admin" ? "Yönetici" : role === "owner" ? "Mekan Sahibi" : "Gezgin"}
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
          <Badge variant={status === "active" ? "outline" : "destructive"} className={status === "active" ? "border-green-500 text-green-600" : ""}>
            {status === "active" ? "Aktif" : status === "suspended" ? "Askıya Alındı" : "Beklemede"}
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
          >
            Kayıt Tarihi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="ml-4">{new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR")}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menü</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
                Detayları Gör
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === "active" ? (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => updateStatus({ userId: user.id, status: "suspended" })}
                >
                  Kullanıcıyı Askıya Al
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => updateStatus({ userId: user.id, status: "active" })}
                >
                  Kullanıcıyı Aktifleştir
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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  // Basic Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4 space-y-4">
          {Array(5).fill(0).map((_, i) => (
             <div key={i} className="flex items-center space-x-4">
                 <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                 <div className="h-4 w-1/4 bg-gray-100 animate-pulse rounded" />
                 <div className="h-4 w-1/4 bg-gray-100 animate-pulse rounded" />
             </div>
          ))}
        </div>
      </div>
    )
  }

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sonuç bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}