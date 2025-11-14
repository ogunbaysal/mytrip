"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  TrendingUp,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Building
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Subscription {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  place: {
    id: string
    name: string
    type: string
    location: string
  }
  plan: {
    id: string
    name: string
    price: number
    currency: string
    billingCycle: "MONTHLY" | "YEARLY"
    features: string[]
  }
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIAL" | "SUSPENDED"
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string | null
  cancelledAt: string | null
  cancelReason: string | null
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
  billingInfo: {
    method: string
    last4: string | null
    brand: string | null
    expiresAt: string | null
  }
  usage: {
    featuredListings: number
    featuredListingsLimit: number
    photosUploaded: number
    photosLimit: number
    viewsThisMonth: number
    bookingRequests: number
  }
  revenue: {
    totalPaid: number
    currentMonthRevenue: number
    lastMonthRevenue: number
    lifetimeValue: number
  }
}

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        // Simulate API call to fetch subscription details
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock subscription data - in real app, this would be an API call
        const mockSubscription: Subscription = {
          id: params.id as string,
          user: {
            id: "user1",
            name: "Mehmet Yılmaz",
            email: "mehmet.yilmaz@example.com",
            avatar: null,
          },
          place: {
            id: "place1",
            name: "Bodrum Marina Otel",
            type: "Otel",
            location: "Bodrum, Muğla",
          },
          plan: {
            id: "premium",
            name: "Premium",
            price: 299,
            currency: "TRY",
            billingCycle: "MONTHLY",
            features: [
              "Öne Çıkan Listeleme",
              "Sınırsız Fotoğraf Yükleme",
              "Detaylı Analitik",
              "Öncelikli Destek",
              "Rezervasyon Yönetimi",
              "İşletme Profili"
            ]
          },
          status: "ACTIVE",
          currentPeriodStart: "2024-11-01T00:00:00Z",
          currentPeriodEnd: "2024-11-30T23:59:59Z",
          nextBillingDate: "2024-12-01T00:00:00Z",
          cancelledAt: null,
          cancelReason: null,
          trialEndsAt: null,
          createdAt: "2024-10-15T09:00:00Z",
          updatedAt: "2024-11-14T10:30:00Z",
          billingInfo: {
            method: "CREDIT_CARD",
            last4: "4242",
            brand: "Visa",
            expiresAt: "2025-08-31T23:59:59Z",
          },
          usage: {
            featuredListings: 2,
            featuredListingsLimit: 5,
            photosUploaded: 45,
            photosLimit: 100,
            viewsThisMonth: 2847,
            bookingRequests: 23,
          },
          revenue: {
            totalPaid: 2392,
            currentMonthRevenue: 299,
            lastMonthRevenue: 299,
            lifetimeValue: 2392,
          }
        }

        setSubscription(mockSubscription)
      } catch (error) {
        toast.error("Abonelik bilgileri yüklenemedi")
        router.push("/subscriptions")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSubscription()
    }
  }, [params.id, router])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default"
      case "TRIAL": return "secondary"
      case "EXPIRED": return "destructive"
      case "CANCELLED": return "outline"
      case "SUSPENDED": return "destructive"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <CheckCircle className="h-4 w-4" />
      case "TRIAL": return <Clock className="h-4 w-4" />
      case "EXPIRED": return <XCircle className="h-4 w-4" />
      case "CANCELLED": return <XCircle className="h-4 w-4" />
      case "SUSPENDED": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Abonelik Detayı</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/subscriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Abonelik Detayı</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Abonelik bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/subscriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Abonelik Detayı</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/subscriptions/${subscription.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusBadgeVariant(subscription.status)} className="flex items-center gap-1">
                      {getStatusIcon(subscription.status)}
                      {subscription.status}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-semibold">{subscription.plan.name} Plan</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {subscription.plan.price} {subscription.plan.currency}/{subscription.plan.billingCycle === "MONTHLY" ? "ay" : "yıl"}
                    </span>
                    <span>•</span>
                    <span>Abonelik ID: #{subscription.id}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User & Place Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kullanıcı
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={subscription.user.avatar || undefined} alt={subscription.user.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{subscription.user.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Mekan
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{subscription.place.name}</div>
                    <div className="text-sm text-muted-foreground">{subscription.place.type}</div>
                    <div className="text-xs text-muted-foreground">{subscription.place.location}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plan Features */}
              <div>
                <h3 className="font-medium mb-3">Plan Özellikleri</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {subscription.plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Billing Information */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Fatura Bilgileri
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ödeme Yöntemi:</span>
                      <span>
                        {subscription.billingInfo.brand} •••• {subscription.billingInfo.last4}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Son Kullanma:</span>
                      <span>{new Date(subscription.billingInfo.expiresAt!).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mevcut Dönem:</span>
                      <span>{new Date(subscription.currentPeriodStart).toLocaleDateString("tr-TR")} - {new Date(subscription.currentPeriodEnd).toLocaleDateString("tr-TR")}</span>
                    </div>
                    {subscription.nextBillingDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sonraki Fatura:</span>
                        <span>{new Date(subscription.nextBillingDate).toLocaleDateString("tr-TR")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Kullanım İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Öne Çıkan Listeler</span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usage.featuredListings}/{subscription.usage.featuredListingsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(subscription.usage.featuredListings / subscription.usage.featuredListingsLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fotoğraf Yüklemeleri</span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usage.photosUploaded}/{subscription.usage.photosLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(subscription.usage.photosUploaded / subscription.usage.photosLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Bu Ay Görüntülenme</span>
                    <span className="text-sm font-medium">{subscription.usage.viewsThisMonth.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{subscription.usage.bookingRequests}</div>
                  <div className="text-sm text-muted-foreground">Bu Ay Rezervasyon İsteği</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{subscription.usage.viewsThisMonth.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Toplam Görüntülenme</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Revenue Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Gelir Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toplam Ödenen:</span>
                  <span className="font-medium">₺{subscription.revenue.totalPaid.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bu Ay:</span>
                  <span className="font-medium">₺{subscription.revenue.currentMonthRevenue.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geçen Ay:</span>
                  <span className="font-medium">₺{subscription.revenue.lastMonthRevenue.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Müşteri Değeri:</span>
                  <span className="font-medium">₺{subscription.revenue.lifetimeValue.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Abonelik Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abonelik ID:</span>
                  <span className="font-mono">#{subscription.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span>{subscription.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fatura Döngüsü:</span>
                  <span>{subscription.plan.billingCycle === "MONTHLY" ? "Aylık" : "Yıllık"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durum:</span>
                  <Badge variant={getStatusBadgeVariant(subscription.status)} className="text-xs">
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Başlangıç:</span>
                  <span>{new Date(subscription.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Güncelleme:</span>
                  <span>{new Date(subscription.updatedAt).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/subscriptions/${subscription.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Aboneliği Düzenle
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Plan Değiştir
              </Button>
              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Fatura Geçmişi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}