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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Eye, Edit, Trash2, Star, Calendar, MessageSquare, Heart, Share, User, Clock } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Blog, mockBlogs, blogCategories, blogStatuses, languages } from "@/lib/mock-data/blogs"

export function BlogsTable() {
  const router = useRouter()
  const [data, setData] = React.useState<Blog[]>(mockBlogs)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleBlogAction = (action: string, blog: Blog) => {
    switch (action) {
      case "view":
        router.push(`/blogs/${blog.id}`)
        break
      case "edit":
        router.push(`/blogs/${blog.id}/edit`)
        break
      case "publish":
        if (blog.status === "published") {
          toast.info(`Blog zaten yayında: ${blog.title}`)
        } else {
          setData(prev =>
            prev.map(b => b.id === blog.id ? {
              ...b,
              status: "published" as const,
              publishedAt: new Date()
            } : b)
          )
          toast.success(`Blog yayınlandı: ${blog.title}`)
        }
        break
      case "unpublish":
        if (blog.status !== "published") {
          toast.info(`Blog zaten yayında değil: ${blog.title}`)
        } else {
          setData(prev =>
            prev.map(b => b.id === blog.id ? { ...b, status: "draft" as const } : b)
          )
          toast.success(`Blog yayından kaldırıldı: ${blog.title}`)
        }
        break
      case "toggle_featured":
        setData(prev =>
          prev.map(b => b.id === blog.id ? { ...b, featured: !b.featured } : b)
        )
        toast.success(`Blog ${blog.featured ? 'öne çıkarılmaktan kaldırıldı' : 'öne çıkarıldı'}: ${blog.title}`)
        break
      case "delete":
        toast.success(`Blog silindi: ${blog.title}`)
        setData(prev => prev.filter(b => b.id !== blog.id))
        break
    }
  }

  const getCategoryLabel = (category: string) => {
    const option = blogCategories.find(opt => opt.value === category)
    return option?.label || category
  }

  const getStatusLabel = (status: string) => {
    const option = blogStatuses.find(opt => opt.value === status)
    return option?.label || status
  }

  const getLanguageLabel = (language: string) => {
    const option = languages.find(opt => opt.value === language)
    return option?.label || language
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published": return "default"
      case "draft": return "secondary"
      case "pending_review": return "outline"
      case "archived": return "destructive"
      default: return "outline"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "travel": return "bg-blue-100 text-blue-800"
      case "food": return "bg-orange-100 text-orange-800"
      case "culture": return "bg-purple-100 text-purple-800"
      case "history": return "bg-amber-100 text-amber-800"
      case "activity": return "bg-green-100 text-green-800"
      case "lifestyle": return "bg-pink-100 text-pink-800"
      case "business": return "bg-gray-100 text-gray-800"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  const columns: ColumnDef<Blog>[] = [
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Blog Yazısı
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const blog = row.original
        return (
          <div className="space-y-2 max-w-md">
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium line-clamp-2">{blog.title}</span>
                  {blog.featured && (
                    <Badge variant="default" className="text-xs bg-yellow-500 text-black">
                      ⭐ Öne Çıkan
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.excerpt}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(blog.category)}`}>
                    {getCategoryLabel(blog.category)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getLanguageLabel(blog.language)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "authorName",
      header: "Yazar",
      cell: ({ row }) => {
        const blog = row.original
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={blog.authorAvatar} alt={blog.authorName} />
              <AvatarFallback className="text-xs">
                {blog.authorName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{blog.authorName}</div>
              <div className="text-muted-foreground">{blog.authorEmail}</div>
            </div>
          </div>
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
      accessorKey: "stats",
      header: "İstatistikler",
      cell: ({ row }) => {
        const blog = row.original
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <Eye className="h-3 w-3" />
              <span>{blog.views.toLocaleString("tr-TR")}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-3 w-3" />
              <span>{blog.likeCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-3 w-3" />
              <span>{blog.commentCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Share className="h-3 w-3" />
              <span>{blog.shareCount}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "publishedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Yayın Tarihi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const blog = row.original
        if (blog.publishedAt) {
          return (
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{blog.publishedAt.toLocaleDateString("tr-TR")}</span>
              </div>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{blog.readTime} dk okuma</span>
              </div>
            </div>
          )
        }
        return (
          <div className="text-sm text-muted-foreground">
            Henüz yayınlanmadı
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const blog = row.original

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
                onClick={() => handleBlogAction("view", blog)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBlogAction("edit", blog)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBlogAction("toggle_featured", blog)}
                className="cursor-pointer"
              >
                <Star className="mr-2 h-4 w-4" />
                {blog.featured ? "Öne Çıkarımdan Kaldır" : "Öne Çıkar"}
              </DropdownMenuItem>
              {blog.status === "published" ? (
                <DropdownMenuItem
                  onClick={() => handleBlogAction("unpublish", blog)}
                  className="cursor-pointer text-orange-600"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Yayından Kaldır
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleBlogAction("publish", blog)}
                  className="cursor-pointer text-green-600"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Yayınla
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBlogAction("delete", blog)}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
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
              <CardTitle>Blog Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm blog yazılarını görüntüleyin ve yönetin. Toplam {data.length} blog yazısı bulunmaktadır.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button asChild>
                <Link href="/blogs/create">Yeni Blog Ekle</Link>
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
                  placeholder="Blog ara..."
                  value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("title")?.setFilterValue(event.target.value)
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
                        {column.id === "title" ? "Blog Yazısı" :
                         column.id === "authorName" ? "Yazar" :
                         column.id === "status" ? "Durum" :
                         column.id === "stats" ? "İstatistikler" :
                         column.id === "publishedAt" ? "Yayın Tarihi" :
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
                {table.getFilteredSelectedRowModel().rows.length} blog yazısı seçildi
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
                {table.getFilteredRowModel().rows.length} blog yazısı seçildi
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