"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  User,
  Upload
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const userEditSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().optional(),
  location: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "CUSTOMER_SUPPORT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  subscriptionStatus: z.enum(["ACTIVE", "EXPIRED", "TRIAL", "CANCELLED"]),
  subscriptionPlan: z.string().optional(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  notes: z.string().optional(),
})

type UserEditForm = z.infer<typeof userEditSchema>

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
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function UserEditPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      role: "CUSTOMER_SUPPORT",
      status: "ACTIVE",
      subscriptionStatus: "TRIAL",
      subscriptionPlan: "",
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      notes: "",
    },
  })

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
          notes: "Kullanıcı platformu aktif kullanıyor. Premium aboneliği mevcut.",
          createdAt: "2024-01-15T09:00:00Z",
          updatedAt: "2024-11-14T10:30:00Z"
        }

        setUser(mockUser)
        form.reset({
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone || "",
          location: mockUser.location || "",
          role: mockUser.role,
          status: mockUser.status,
          subscriptionStatus: mockUser.subscriptionStatus,
          subscriptionPlan: mockUser.subscriptionPlan || "",
          emailVerified: mockUser.emailVerified,
          phoneVerified: mockUser.phoneVerified,
          twoFactorEnabled: mockUser.twoFactorEnabled,
          notes: mockUser.notes || "",
        })
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
  }, [params.id, router, form])

  const onSubmit = async (data: UserEditForm) => {
    if (!user) return

    try {
      setSaving(true)

      // Simulate API call to update user
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real app, this would be an API call
      console.log("Updating user:", {
        id: user.id,
        ...data,
        updatedAt: new Date().toISOString(),
      })

      toast.success("Kullanıcı bilgileri başarıyla güncellendi")
      router.push(`/users/${user.id}`)
    } catch (error) {
      toast.error("Kullanıcı güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcıyı Düzenle</h1>
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
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
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
            <Link href={`/users/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcıyı Düzenle</h1>
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
            <Link href={`/users/${user.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Kullanıcıyı Düzenle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/users/${user.id}`}>
              İptal
            </Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Avatar Yükle
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG veya GIF. Maksimum 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Ad Soyad girin"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="ornek@email.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="+90 532 123 4567"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Konum</Label>
                    <Input
                      id="location"
                      {...form.register("location")}
                      placeholder="Şehir, Ülke"
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Hesap Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={form.watch("role")}
                      onValueChange={(value) => form.setValue("role", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MODERATOR">Moderatör</SelectItem>
                        <SelectItem value="CUSTOMER_SUPPORT">Müşteri Hizmetleri</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.role && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select
                      value={form.watch("status")}
                      onValueChange={(value) => form.setValue("status", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="INACTIVE">Pasif</SelectItem>
                        <SelectItem value="SUSPENDED">Askıya Alındı</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.status.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailVerified">E-posta Onayı</Label>
                      <p className="text-sm text-muted-foreground">
                        Kullanıcının e-posta adresi doğrulanmış
                      </p>
                    </div>
                    <Switch
                      id="emailVerified"
                      checked={form.watch("emailVerified")}
                      onCheckedChange={(checked) => form.setValue("emailVerified", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="phoneVerified">Telefon Onayı</Label>
                      <p className="text-sm text-muted-foreground">
                        Kullanıcının telefon numarası doğrulanmış
                      </p>
                    </div>
                    <Switch
                      id="phoneVerified"
                      checked={form.watch("phoneVerified")}
                      onCheckedChange={(checked) => form.setValue("phoneVerified", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="twoFactorEnabled">İki Faktörlü Kimlik Doğrulama</Label>
                      <p className="text-sm text-muted-foreground">
                        Kullanıcının hesabına ek güvenlik katmanı ekler
                      </p>
                    </div>
                    <Switch
                      id="twoFactorEnabled"
                      checked={form.watch("twoFactorEnabled")}
                      onCheckedChange={(checked) => form.setValue("twoFactorEnabled", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Abonelik Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionStatus">Abonelik Durumu</Label>
                    <Select
                      value={form.watch("subscriptionStatus")}
                      onValueChange={(value) => form.setValue("subscriptionStatus", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Abonelik durumu seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="TRIAL">Deneme</SelectItem>
                        <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                        <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subscriptionStatus && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.subscriptionStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Abonelik Planı</Label>
                    <Input
                      id="subscriptionPlan"
                      {...form.register("subscriptionPlan")}
                      placeholder="Örn: Premium, Professional"
                    />
                    {form.formState.errors.subscriptionPlan && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.subscriptionPlan.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  {...form.register("notes")}
                  placeholder="Kullanıcı hakkında notlar..."
                  rows={4}
                />
                {form.formState.errors.notes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kullanıcı ID:</span>
                    <span className="font-mono">#{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kayıt Tarihi:</span>
                    <span>{new Date(user.joinDate).toLocaleDateString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Rezervasyon:</span>
                    <span>{user.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Harcama:</span>
                    <span>₺{user.totalSpent.toLocaleString("tr-TR")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{user.totalBookings}</div>
                    <div className="text-xs text-muted-foreground">Rezervasyon</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      ₺{user.totalSpent.toLocaleString("tr-TR")}
                    </div>
                    <div className="text-xs text-muted-foreground">Harcama</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}