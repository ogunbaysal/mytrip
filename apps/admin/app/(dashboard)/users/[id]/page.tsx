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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CreditCard,
  Edit,
  User
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "CUSTOMER_SUPPORT"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  location: string | null
  joinDate: string
  lastActive: string
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "TRIAL" | "CANCELLED"
  subscriptionPlan: string | null
  totalBookings: number
  totalSpent: number
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        // Simulate API call to fetch user details
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock user data - in real app, this would be an API call
        const mockUser: User = {
          id: params.id as string,
          name: "Ahmet Yılmaz",
          email: "ahmet.yilmaz@example.com",
          phone: "+90 532 123 4567",
          avatar: null,
          role: "ADMIN",
          status: "ACTIVE",
          location: "Muğla, Türkiye",
          joinDate: "2024-01-15",
          lastActive: "2024-11-14T10:30:00Z",
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: "Premium",
          totalBookings: 24,
          totalSpent: 15750,
          emailVerified: true,
          phoneVerified: true,
          twoFactorEnabled: true,
          createdAt: "2024-01-15T09:00:00Z",
          updatedAt: "2024-11-14T10:30:00Z"
        }

        setUser(mockUser)
      } catch (error) {
        toast.error("Kullanıcı bilgileri yüklenemedi")
        router.push("/users")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id, router])

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "destructive"
      case "ADMIN": return "default"
      case "MODERATOR": return "secondary"
      case "CUSTOMER_SUPPORT": return "outline"
      default: return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default"
      case "INACTIVE": return "secondary"
      case "SUSPENDED": return "destructive"
      default: return "outline"
    }
  }

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default"
      case "TRIAL": return "secondary"
      case "EXPIRED": return "destructive"
      case "CANCELLED": return "outline"
      default: return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcı Detayı</h1>
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
                <div className="h-20 bg-gray-200 rounded"></div>
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

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcı Detayı</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
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
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcı Detayı</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>ID: #{user.id}</span>
                  <span>•</span>
                  <span>Kayıt: {new Date(user.joinDate).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                İletişim Bilgileri
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">E-posta:</span>
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="secondary" className="text-xs">Onaylı</Badge>
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Telefon:</span>
                    <span>{user.phone}</span>
                    {user.phoneVerified && (
                      <Badge variant="secondary" className="text-xs">Onaylı</Badge>
                    )}
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Konum:</span>
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Account Information */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Hesap Bilgileri
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">İki Faktörlü Kimlik Doğrulama:</span>
                  <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                    {user.twoFactorEnabled ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Son Aktivite:</span>
                  <span>{new Date(user.lastActive).toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Son Güncelleme:</span>
                  <span>{new Date(user.updatedAt).toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Booking Statistics */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rezervasyon İstatistikleri
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{user.totalBookings}</div>
                  <div className="text-sm text-muted-foreground">Toplam Rezervasyon</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">₺{user.totalSpent.toLocaleString("tr-TR")}</div>
                  <div className="text-sm text-muted-foreground">Toplam Harcama</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Abonelik Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Durum:</span>
                <Badge variant={getSubscriptionBadgeVariant(user.subscriptionStatus)}>
                  {user.subscriptionStatus}
                </Badge>
              </div>
              {user.subscriptionPlan && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm">{user.subscriptionPlan}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/users/${user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Kullanıcıyı Düzenle
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                E-posta Gönder
              </Button>
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Şifre Sıfırla
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}