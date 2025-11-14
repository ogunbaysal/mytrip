import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, FileText, CreditCard, TrendingUp, Eye, Clock } from "lucide-react"

const dashboardStats = [
  {
    title: "Toplam Kullanıcı",
    value: "1,234",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Aktif Mekan",
    value: "456",
    change: "+8%",
    trend: "up",
    icon: MapPin,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Bekleyen Blog",
    value: "23",
    change: "-2%",
    trend: "down",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    title: "Aylık Gelir",
    value: "₺45,678",
    change: "+18%",
    trend: "up",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

const recentActivity = [
  {
    id: 1,
    user: "Ahmet Yılmaz",
    action: "yeni mekan ekledi",
    details: "Villa Akdeniz",
    time: "5 dakika önce",
    status: "pending",
  },
  {
    id: 2,
    user: "Ayşe Demir",
    action: "blog yazısı gönderdi",
    details: "Muğla'da Gezilecek Yerler",
    time: "15 dakika önce",
    status: "pending",
  },
  {
    id: 3,
    user: "Mehmet Kaya",
    action: "abonelik yeniledi",
    details: "Premium Plan",
    time: "1 saat önce",
    status: "success",
  },
  {
    id: 4,
    user: "Zeynep Çelik",
    action: "mekan bilgilerini güncelledi",
    details: "Otel Deniz Yıldızı",
    time: "2 saat önce",
    status: "success",
  },
  {
    id: 5,
    user: "Can Öztürk",
    action: "yeni kullanıcı kaydı",
    details: "mekan sahibi",
    time: "3 saat önce",
    status: "success",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel</h2>
        <div className="flex items-center space-x-2">
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span>geçen ay</span>
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 rounded-lg border p-3">
                  <div className="flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.details}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
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