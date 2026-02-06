"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, FileText, RefreshCw } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type OverviewResponse = {
  overview: {
    users: { total: number; new: number; active: number }
    places: { total: number; active: number; new: number; totalViews: number; verified: number }
    bookings: {
      total: number
      new: number
      confirmed: number
      totalRevenue: number
      recentRevenue: number
    }
    reviews: { total: number; new: number; averageRating: number; published: number }
    events: { total: number; recent: number; pageViews: number; searches: number; bookings: number }
  }
}

type DailyStatsResponse = {
  dailyStats: {
    users: Array<{ date: string; count: number }>
    bookings: Array<{ date: string; count: number; revenue: number }>
    events: Array<{ date: string; views: number; searches: number; bookings: number }>
  }
}

type PaymentResponse = {
  payments: Array<{
    id: string
    amount: string | number
    currency: "TRY" | "USD" | "EUR"
    status: "success" | "failed" | "pending" | "refunded"
    date: string
    user?: { email?: string | null }
  }>
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("30")
  const [reportType, setReportType] = useState("overview")

  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["reports", "overview", period],
    queryFn: () => apiFetch<OverviewResponse>(`/api/admin/analytics/overview?period=${period}`),
  })

  const {
    data: dailyStats,
    isLoading: dailyStatsLoading,
    refetch: refetchDailyStats,
  } = useQuery({
    queryKey: ["reports", "daily-stats", period],
    queryFn: () => apiFetch<DailyStatsResponse>(`/api/admin/analytics/daily-stats?period=${period}`),
  })

  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ["reports", "payments"],
    queryFn: () => apiFetch<PaymentResponse>("/api/admin/payments"),
  })

  const isLoading = overviewLoading || dailyStatsLoading || paymentsLoading

  const totals = useMemo(() => {
    const paymentRows = payments?.payments ?? []
    const successPayments = paymentRows.filter((row) => row.status === "success")
    const totalSuccessfulPayments = successPayments.length
    const successfulAmount = successPayments.reduce(
      (sum, row) => sum + (typeof row.amount === "number" ? row.amount : Number(row.amount)),
      0,
    )
    return {
      totalSuccessfulPayments,
      successfulAmount,
      totalPayments: paymentRows.length,
    }
  }, [payments?.payments])

  const downloadReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      periodInDays: Number(period),
      type: reportType,
      overview: overview?.overview ?? null,
      dailyStats: dailyStats?.dailyStats ?? null,
      payments: payments?.payments ?? [],
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `report-${reportType}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const refreshAll = async () => {
    await Promise.all([refetchOverview(), refetchDailyStats(), refetchPayments()])
  }

  if (isLoading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raporlar</h2>
          <p className="text-muted-foreground">
            Gerçek sistem verileri ile rapor özeti ve dışa aktarma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Raporu İndir
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Dönem</p>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Dönem seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 Gün</SelectItem>
              <SelectItem value="30">Son 30 Gün</SelectItem>
              <SelectItem value="90">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Rapor Tipi</p>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Rapor tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Genel Özet</SelectItem>
              <SelectItem value="payments">Ödemeler</SelectItem>
              <SelectItem value="daily">Günlük İstatistikler</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview.users.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Mekan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview.places.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Başarılı Ödeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalSuccessfulPayments}</div>
            <p className="text-xs text-muted-foreground">Toplam ödeme: {totals.totalPayments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ödeme Tutarı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
              }).format(totals.successfulAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Son Ödemeler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(payments?.payments ?? []).slice(0, 10).map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium">{row.user?.email ?? "Bilinmeyen kullanıcı"}</p>
                <p className="text-muted-foreground">{new Date(row.date).toLocaleString("tr-TR")}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: row.currency,
                  }).format(typeof row.amount === "number" ? row.amount : Number(row.amount))}
                </p>
                <p className="text-xs text-muted-foreground">{row.status}</p>
              </div>
            </div>
          ))}
          {(payments?.payments ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Ödeme kaydı bulunamadı.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
