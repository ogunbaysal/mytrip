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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Eye, Edit, CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, User, BarChart } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import { subscriptionStatuses, billingCycles } from "@/lib/mock-data/subscriptions"
import { Subscription } from "@/types/subscriptions"

interface SubscriptionsTableProps {
  initialData: Subscription[];
}

export function SubscriptionsTable({ initialData }: SubscriptionsTableProps) {
  const router = useRouter()
  const [data, setData] = React.useState<Subscription[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Update data if initialData changes (optional, depending on if we want full sync)
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSubscriptionAction = (action: string, subscription: Subscription) => {
    switch (action) {
      case "view":
        router.push(`/subscriptions/${subscription.id}`)
        break
      case "edit":
        router.push(`/subscriptions/${subscription.id}/edit`)
        break
      case "upgrade":
        toast.info(`Abonelik yükseltme: ${subscription.ownerName}`)
        break
      case "downgrade":
        toast.info(`Abonelik düşürme: ${subscription.ownerName}`)
        break
      case "cancel":
        if (subscription.status === "cancelled") {
          toast.info(`Abonelik zaten iptal edilmiş: ${subscription.ownerName}`)
        } else {
          setData(prev =>
            prev.map(s => s.id === subscription.id ? {
              ...s,
              status: "cancelled" as const,
              cancelledAt: new Date()
            } : s)
          )
          toast.success(`Abonelik iptal edildi: ${subscription.ownerName}`)
        }
        break
      case "reactivate":
        if (subscription.status === "active") {
          toast.info(`Abonelik zaten aktif: ${subscription.ownerName}`)
        } else {
          setData(prev =>
            prev.map(s => s.id === subscription.id ? {
              ...s,
              status: "active" as const,
              cancelledAt: undefined,
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            } : s)
          )
          toast.success(`Abonelik yeniden aktifleştirildi: ${subscription.ownerName}`)
        }
        break
      case "extend_trial":
        if (subscription.status !== "trial") {
          toast.info(`Deneme sürümü değil: ${subscription.ownerName}`)
        } else {
          const newEndDate = new Date(subscription.endDate)
          newEndDate.setDate(newEndDate.getDate() + 7) // extend trial by 7 days
          setData(prev =>
            prev.map(s => s.id === subscription.id ? {
              ...s,
              trialEndsAt: newEndDate,
              endDate: newEndDate
            } : s)
          )
          toast.success(`Deneme süresi uzatıldı: ${subscription.ownerName}`)
        }
        break
    }
  }

  const getStatusLabel = (status: string) => {
    const option = subscriptionStatuses.find(opt => opt.value === status)
    return option?.label || status
  }

  const getBillingCycleLabel = (cycle: string) => {
    const option = billingCycles.find(opt => opt.value === cycle)
    return option?.label || cycle
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "trial": return "secondary"
      case "pending": return "outline"
      case "expired": return "destructive"
      case "cancelled": return "destructive"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-3 w-3" />
      case "trial": return <Clock className="h-3 w-3" />
      case "pending": return <AlertCircle className="h-3 w-3" />
      case "expired": return <XCircle className="h-3 w-3" />
      case "cancelled": return <XCircle className="h-3 w-3" />
      default: return null
    }
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0 // unlimited
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    return "text-green-600"
  }

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "credit_card": return <CreditCard className="h-4 w-4" />
      case "bank_transfer": return <DollarSign className="h-4 w-4" />
      case "paypal": return <User className="h-4 w-4" />
      default: return null
    }
  }

  const getPaymentMethodLabel = (type: string, lastFour?: string) => {
    switch (type) {
      case "credit_card": return `Kredi Kartı •••• ${lastFour}`
      case "bank_transfer": return "Havale/EFT"
      case "paypal": return "PayPal"
      default: return type
    }
  }

  const columns: ColumnDef<Subscription>[] = [
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
      accessorKey: "ownerName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Müşteri
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const subscription = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{subscription.ownerName}</span>
            </div>
            <div className="text-sm text-muted-foreground">{subscription.ownerEmail}</div>
            {subscription.placeName && (
              <div className="text-xs text-muted-foreground">
                Mekan: {subscription.placeName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "planName",
      header: "Paket",
      cell: ({ row }) => {
        const subscription = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{subscription.planName}</div>
            <div className="text-sm text-muted-foreground">
              {getBillingCycleLabel(subscription.billingCycle)}
            </div>
            <div className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: subscription.currency
              }).format(subscription.price)}
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
        const subscription = row.original
        return (
          <div className="space-y-1">
            <Badge variant={getStatusBadgeVariant(status)} className="flex items-center space-x-1">
              {getStatusIcon(status)}
              <span>{getStatusLabel(status)}</span>
            </Badge>
            {subscription.trialEndsAt && (
              <div className="text-xs text-orange-600">
                Deneme bitiş: {subscription.trialEndsAt.toLocaleDateString("tr-TR")}
              </div>
            )}
            {subscription.cancelledAt && (
              <div className="text-xs text-red-600">
                İptal: {subscription.cancelledAt.toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "usage",
      header: "Kullanım",
      cell: ({ row }) => {
        const subscription = row.original
        const { usage, limits } = subscription

        return (
          <div className="space-y-2 min-w-[200px]">
            {/* Places Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Mekanlar</span>
                <span className={getUsageColor(getUsagePercentage(usage.currentPlaces, limits.maxPlaces))}>
                  {usage.currentPlaces} / {limits.maxPlaces === -1 ? "∞" : limits.maxPlaces}
                </span>
              </div>
              {limits.maxPlaces !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.currentPlaces, limits.maxPlaces)}
                  className="h-1"
                />
              )}
            </div>

            {/* Blogs Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Blog Yazıları</span>
                <span className={getUsageColor(getUsagePercentage(usage.currentBlogs, limits.maxBlogs))}>
                  {usage.currentBlogs} / {limits.maxBlogs === -1 ? "∞" : limits.maxBlogs}
                </span>
              </div>
              {limits.maxBlogs !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.currentBlogs, limits.maxBlogs)}
                  className="h-1"
                />
              )}
            </div>

            {/* Photos Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Fotoğraflar</span>
                <span className={getUsageColor(getUsagePercentage(usage.currentPhotos, limits.maxPhotos))}>
                  {usage.currentPhotos} / {limits.maxPhotos === -1 ? "∞" : limits.maxPhotos}
                </span>
              </div>
              {limits.maxPhotos !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.currentPhotos, limits.maxPhotos)}
                  className="h-1"
                />
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "dates",
      header: "Tarihler",
      cell: ({ row }) => {
        const subscription = row.original
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Başlangıç: {subscription.startDate.toLocaleDateString("tr-TR")}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Bitiş: {subscription.endDate.toLocaleDateString("tr-TR")}</span>
            </div>
            {subscription.nextBillingDate && (
              <div className="text-xs text-green-600">
                Sonraki ödeme: {subscription.nextBillingDate.toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Ödeme",
      cell: ({ row }) => {
        const subscription = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-sm">
              {getPaymentMethodIcon(subscription.paymentMethod.type)}
              <span>{getPaymentMethodLabel(subscription.paymentMethod.type, subscription.paymentMethod.lastFour)}</span>
            </div>
            {subscription.paymentHistory.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Son ödeme: {subscription.paymentHistory[0].date.toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const subscription = row.original

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
                onClick={() => handleSubscriptionAction("view", subscription)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSubscriptionAction("edit", subscription)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSubscriptionAction("upgrade", subscription)}
                className="cursor-pointer text-green-600"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Yükselt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSubscriptionAction("downgrade", subscription)}
                className="cursor-pointer text-orange-600"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Düşür
              </DropdownMenuItem>
              {subscription.status === "trial" && (
                <DropdownMenuItem
                  onClick={() => handleSubscriptionAction("extend_trial", subscription)}
                  className="cursor-pointer text-blue-600"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Denemeyi Uzat
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {subscription.status === "active" || subscription.status === "trial" ? (
                <DropdownMenuItem
                  onClick={() => handleSubscriptionAction("cancel", subscription)}
                  className="cursor-pointer text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  İptal Et
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleSubscriptionAction("reactivate", subscription)}
                  className="cursor-pointer text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Yeniden Aktifleştir
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

  const totalRevenue = data
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.price, 0)

  const activeSubscriptions = data.filter(s => s.status === "active").length
  const trialSubscriptions = data.filter(s => s.status === "trial").length
  const expiredSubscriptions = data.filter(s => s.status === "expired").length

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Abonelikler</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +2 geçen aydan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deneme Süremleri</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              1 hafta içinde bitecek
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aylık Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{totalRevenue.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% geçen aydan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolan</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              İletişime geçilecek
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Abonelik Yönetimi</CardTitle>
              <CardDescription>
                Tüm abonelikleri görüntüleyin, yönetin ve gelir durumunu takip edin. Toplam {data.length} abonelik bulunmaktadır.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                Gelir Raporları
              </Button>
              <Button asChild>
                <Link href="/subscriptions/create">Yeni Abonelik</Link>
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
                  placeholder="Müşteri ara..."
                  value={(table.getColumn("ownerName")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("ownerName")?.setFilterValue(event.target.value)
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
                        {column.id === "ownerName" ? "Müşteri" :
                         column.id === "planName" ? "Paket" :
                         column.id === "status" ? "Durum" :
                         column.id === "usage" ? "Kullanım" :
                         column.id === "dates" ? "Tarihler" :
                         column.id === "paymentMethod" ? "Ödeme" :
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
                {table.getFilteredSelectedRowModel().rows.length} abonelik seçildi
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
                {table.getFilteredRowModel().rows.length} abonelik seçildi
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