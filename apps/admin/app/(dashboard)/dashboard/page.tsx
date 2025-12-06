"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, FileText, CreditCard, Eye, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAnalyticsOverview, useRecentActivity } from "@/hooks/use-analytics"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: isLoadingStats } = useAnalyticsOverview()
  const { data: activities, isLoading: isLoadingActivities } = useRecentActivity()
  
  const dashboardStats = [
    {
      title: "Toplam Kullanıcı",
      value: stats?.users.total.toLocaleString("tr-TR") || "0",
      change: stats?.users.new ? `+${stats.users.new}` : "0",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      periodLabel: "yeni kullanıcı",
    },
    {
      title: "Aktif Mekan",
      value: stats?.places.active.toLocaleString("tr-TR") || "0",
      change: stats?.places.new ? `+${stats.places.new}` : "0",
      trend: "up",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-100",
      periodLabel: "yeni mekan",
    },
    {
      title: "Toplam Blog",
      value: stats?.reviews.total.toLocaleString("tr-TR") || "0", // Map review stats or blog stats here? API returns reviews in overview, dashboard mock had blogs. Let's use reviews for now or placeholder
      change: stats?.reviews.new ? `+${stats.reviews.new}` : "0",
      trend: "up", // Assuming up
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      periodLabel: "yeni inceleme",
    },
    {
      title: "Toplam Gelir",
      value: stats?.bookings.totalRevenue 
        ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.bookings.totalRevenue) 
        : "₺0,00",
      change: stats?.bookings.recentRevenue 
        ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.bookings.recentRevenue) 
        : "₺0,00",
      trend: "up",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      periodLabel: "son 30 gün",
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Hoşgeldin, {user?.name || "Admin"}
          </Badge>
          <Badge variant="outline">Son 30 gün</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">
                  {stat.change}
                </span>
                <span>{stat.periodLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>
              Platformdaki son hareketler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingActivities ? (
                // Loading Skeletons
                Array(5).fill(0).map((_, i) => (
                   <div key={i} className="flex items-center space-x-4 rounded-lg border p-3">
                     <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                     <div className="space-y-2 flex-1">
                       <div className="h-4 w-1/3 bg-gray-100 animate-pulse rounded" />
                       <div className="h-3 w-1/4 bg-gray-100 animate-pulse rounded" />
                     </div>
                   </div>
                ))
              ) : activities?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Henüz bir aktivite yok.
                </div>
              ) : (
                activities?.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 rounded-lg border p-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        <span className="font-semibold">{activity.userId}</span>{" "}
                        {activity.eventType === "view" ? "görüntüledi" : 
                         activity.eventType === "search" ? "arama yaptı" : 
                         activity.eventType === "booking" ? "rezervasyon yaptı" : "işlem yaptı"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.placeId ? `Mekan ID: ${activity.placeId}` : "Sistem"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true,
                          locale: tr 
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>
              Sık kullanılan yönetim işlemleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <button className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Bekleyen İçerikleri İncele</span>
                <Badge variant="secondary">26</Badge>
              </button>
              <button className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Yeni Kullanıcı Ekle</span>
              </button>
              <button className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Blog Yazısı Oluştur</span>
              </button>
              <button className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Öne Çıkan Mekanlar</span>
              </button>
              <button className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <CreditCard className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Abonelik Raporları</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}