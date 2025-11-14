"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  DollarSign,
  ShoppingCart,
  Store,
  Globe
} from "lucide-react"

const analyticsData = {
  overview: {
    totalUsers: 12543,
    totalViews: 89734,
    totalSessions: 45678,
    avgSessionDuration: "4:23",
    bounceRate: 32.5,
    conversionRate: 3.2,
    revenue: 45678,
    growth: {
      users: 12.5,
      views: 18.2,
      sessions: 15.7,
      revenue: 23.4
    }
  },
  traffic: {
    sources: [
      { name: "Organik Arama", value: 3543, percentage: 28.5, color: "#10b981" },
      { name: "Doğrudan", value: 2876, percentage: 23.1, color: "#3b82f6" },
      { name: "Sosyal Medya", value: 2198, percentage: 17.7, color: "#f59e0b" },
      { name: "E-posta", value: 1654, percentage: 13.3, color: "#8b5cf6" },
      { name: "Yönlendirme", value: 1234, percentage: 9.9, color: "#ec4899" },
      { name: "Diğer", value: 943, percentage: 7.5, color: "#6b7280" }
    ],
    devices: [
      { name: "Masaüstü", value: 5432, percentage: 45.2, color: "#3b82f6" },
      { name: "Mobil", value: 5234, percentage: 43.6, color: "#10b981" },
      { name: "Tablet", value: 1342, percentage: 11.2, color: "#f59e0b" }
    ],
    locations: [
      { name: "Türkiye", value: 8765, percentage: 69.9 },
      { name: "Almanya", value: 1234, percentage: 9.8 },
      { name: "Rusya", value: 987, percentage: 7.9 },
      { name: "Hollanda", value: 654, percentage: 5.2 },
      { name: "İngiltere", value: 543, percentage: 4.3 },
      { name: "Diğer", value: 365, percentage: 2.9 }
    ]
  },
  content: {
    topPages: [
      { path: "/places/marmaris", views: 5432, users: 3421, avgTime: "3:45" },
      { path: "/places/fethiye", views: 4567, users: 2876, avgTime: "4:12" },
      { path: "/places/bodrum", views: 3987, users: 2543, avgTime: "3:28" },
      { path: "/blog/marmaris-rehberi", views: 3214, users: 2134, avgTime: "5:18" },
      { path: "/places/datca", views: 2876, users: 1987, avgTime: "3:56" },
      { path: "/blog/fethiye-koyleri", views: 2543, users: 1765, avgTime: "4:45" },
      { path: "/places/dalaman", views: 2187, users: 1543, avgTime: "3:12" },
      { path: "/", views: 1987, users: 1432, avgTime: "2:34" }
    ],
    categories: [
      { name: "Restoranlar", views: 23456, percentage: 32.1 },
      { name: "Oteller", views: 19876, percentage: 27.2 },
      { name: "Aktiviteler", views: 15432, percentage: 21.1 },
      { name: "Mağazalar", views: 8765, percentage: 12.0 },
      { name: "Hizmetler", views: 5643, percentage: 7.6 }
    ]
  },
  conversions: {
    funnels: [
      { stage: "Ziyaretçi", count: 12543, conversion: 100 },
      { stage: "Sayfa Görüntüleme", count: 8973, conversion: 71.5 },
      { stage: "Mekan Detay", count: 4567, conversion: 36.4 },
      { stage: "İletişim", count: 1234, conversion: 9.8 },
      { stage: "Rezervasyon", count: 456, conversion: 3.6 }
    ],
    goals: [
      { name: "Mekan Rezervasyonu", completed: 456, target: 500, percentage: 91.2 },
      { name: "Bülten Aboneliği", completed: 789, target: 1000, percentage: 78.9 },
      { name: "İletişim Formu", completed: 234, target: 300, percentage: 78.0 },
      { name: "İndirme", completed: 123, target: 150, percentage: 82.0 }
    ]
  }
}

const monthlyData = [
  { month: "Oca", users: 8934, views: 45678, sessions: 23456, revenue: 28765 },
  { month: "Şub", users: 9234, views: 48765, sessions: 24567, revenue: 31234 },
  { month: "Mar", users: 9876, views: 52345, sessions: 26789, revenue: 34567 },
  { month: "Nis", users: 10432, views: 56789, sessions: 28976, revenue: 37890 },
  { month: "May", users: 11234, views: 61234, sessions: 31234, revenue: 40123 },
  { month: "Haz", users: 12543, views: 67890, sessions: 34567, revenue: 45678 }
]

const weeklyData = [
  { week: "1. Hafta", users: 2876, views: 15678, sessions: 7890, revenue: 9876 },
  { week: "2. Hafta", users: 3123, views: 16890, sessions: 8456, revenue: 10543 },
  { week: "3. Hafta", users: 3234, views: 17543, sessions: 8765, revenue: 11234 },
  { week: "4. Hafta", users: 3310, views: 17779, sessions: 9456, revenue: 14025 }
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(num)
  }

  const MetricCard = ({ title, value, change, icon: Icon, suffix = "" }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                {suffix === "currency" ? formatCurrency(value) : formatNumber(value)}
                {suffix === "time" ? ` ${value}` : suffix}
              </h3>
            </div>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-muted-foreground">geçen dönem</span>
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Platformunuzun performans metriklerini ve analizlerini görüntüleyin.
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
              <SelectItem value="90d">Son 3 ay</SelectItem>
              <SelectItem value="1y">Son 1 yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Kullanıcı"
          value={analyticsData.overview.totalUsers}
          change={analyticsData.overview.growth.users}
          icon={Users}
        />
        <MetricCard
          title="Sayfa Görüntüleme"
          value={analyticsData.overview.totalViews}
          change={analyticsData.overview.growth.views}
          icon={Eye}
        />
        <MetricCard
          title="Oturum Süresi"
          value={analyticsData.overview.avgSessionDuration}
          icon={Clock}
          suffix="time"
        />
        <MetricCard
          title="Çıkış Oranı"
          value={analyticsData.overview.bounceRate}
          icon={TrendingDown}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard
          title="Dönüşüm Oranı"
          value={analyticsData.overview.conversionRate}
          icon={Activity}
          suffix="%"
        />
        <MetricCard
          title="Gelir"
          value={analyticsData.overview.revenue}
          change={analyticsData.overview.growth.revenue}
          icon={DollarSign}
          suffix="currency"
        />
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Trafik</TabsTrigger>
          <TabsTrigger value="content">İçerik</TabsTrigger>
          <TabsTrigger value="conversions">Dönüşümler</TabsTrigger>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Trafik Kaynakları</CardTitle>
                <CardDescription>
                  Ziyaretçilerin platformunuza nasıl ulaştığı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.traffic.sources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.traffic.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cihaz Dağılımı</CardTitle>
                <CardDescription>
                  Ziyaretçi cihaz türleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.traffic.devices.map((device) => (
                    <div key={device.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{device.name}</span>
                        <span>{device.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${device.percentage}%`,
                            backgroundColor: device.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coğrafi Dağılım</CardTitle>
              <CardDescription>
                Ziyaretçilerin geldiği ülkeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.traffic.locations.map((location) => (
                  <div key={location.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(location.value)} ziyaretçi</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{location.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popüler Sayfalar</CardTitle>
                <CardDescription>
                  En çok görüntülenen sayfalar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.content.topPages.map((page, index) => (
                    <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{page.path}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(page.users)} kullanıcı • {page.avgTime}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(page.views)}</p>
                        <p className="text-sm text-muted-foreground">görüntülenme</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Performansı</CardTitle>
                <CardDescription>
                  Kategori bazında görüntüleme istatistikleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.content.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dönüşüm Hunisi</CardTitle>
                <CardDescription>
                  Kullanıcı yolculuğu ve dönüşüm oranları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.conversions.funnels} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hedef Performansı</CardTitle>
                <CardDescription>
                  Belirlenen hedeflere ulaşma durumu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.conversions.goals.map((goal) => (
                    <div key={goal.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{goal.name}</span>
                        <span>{goal.completed} / {goal.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            goal.percentage >= 80 ? 'bg-green-500' :
                            goal.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{goal.percentage}% tamamlandı</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Trendler</CardTitle>
              <CardDescription>
                Son 6 aylık performans trendleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Kullanıcılar" />
                  <Line type="monotone" dataKey="views" stroke="#10b981" name="Görüntüleme" />
                  <Line type="monotone" dataKey="sessions" stroke="#f59e0b" name="Oturumlar" />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Gelir" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Haftalık Performans</CardTitle>
              <CardDescription>
                Bu ayki haftalık performans karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                  <Area type="monotone" dataKey="views" stackId="1" stroke="#10b981" fill="#10b981" />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}