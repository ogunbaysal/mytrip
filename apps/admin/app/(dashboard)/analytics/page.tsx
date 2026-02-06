"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, TrendingUp, Users, MapPin, BookOpen, DollarSign } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useAnalyticsOverview, useRecentActivity } from "@/hooks/use-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DailyStatsResponse = {
  dailyStats: {
    users: Array<{ date: string; count: number }>
    bookings: Array<{ date: string; count: number; revenue: number }>
    events: Array<{ date: string; views: number; searches: number; bookings: number }>
  }
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30")
  const queryClient = useQueryClient()

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(period)
  const { data: events, isLoading: eventsLoading } = useRecentActivity(20)
  const { data: dailyStats, isLoading: dailyStatsLoading } = useQuery({
    queryKey: ["analytics", "daily-stats", period],
    queryFn: () =>
      apiFetch<DailyStatsResponse>(`/api/admin/analytics/daily-stats?period=${period}`).then(
        (res) => res.dailyStats,
      ),
  })

  const isLoading = overviewLoading || eventsLoading || dailyStatsLoading

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", "events"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", "daily-stats"] }),
    ])
  }

  if (isLoading) {
    return <div>Yükleniyor...</div>
  }

  const cards = [
    {
      title: "Toplam Kullanıcı",
      value: overview?.users.total ?? 0,
      subtitle: `Yeni: ${overview?.users.new ?? 0}`,
      icon: Users,
    },
    {
      title: "Toplam Mekan",
      value: overview?.places.total ?? 0,
      subtitle: `Aktif: ${overview?.places.active ?? 0}`,
      icon: MapPin,
    },
    {
      title: "Toplam Rezervasyon",
      value: overview?.bookings.total ?? 0,
      subtitle: `Onaylı: ${overview?.bookings.confirmed ?? 0}`,
      icon: BookOpen,
    },
    {
      title: "Toplam Gelir",
      value: new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(overview?.bookings.totalRevenue ?? 0),
      subtitle: `Son ${period} gün: ${new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(overview?.bookings.recentRevenue ?? 0)}`,
      icon: DollarSign,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Gerçek zamanlı sistem metrikleri ve etkinlik verileri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Dönem seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Kullanıcı Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dailyStats?.users ?? []).slice(-10).map((item) => (
              <div key={`${item.date}-users`} className="flex items-center justify-between text-sm">
                <span>{new Date(item.date).toLocaleDateString("tr-TR")}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Günlük Rezervasyon Geliri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dailyStats?.bookings ?? []).slice(-10).map((item) => (
              <div
                key={`${item.date}-booking`}
                className="flex items-center justify-between text-sm"
              >
                <span>{new Date(item.date).toLocaleDateString("tr-TR")}</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(item.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Son Etkinlikler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{event.eventType}</p>
                    <p className="text-muted-foreground">
                      User: {event.userId || "-"} Place: {event.placeId || "-"}
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Kayıtlı etkinlik bulunamadı.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
