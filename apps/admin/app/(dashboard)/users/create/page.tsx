"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Plus,
  User,
  Upload,
  Shield,
  CreditCard
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const userCreateSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().optional(),
  location: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "CUSTOMER_SUPPORT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  subscriptionStatus: z.enum(["ACTIVE", "EXPIRED", "TRIAL", "CANCELLED"]).default("TRIAL"),
  subscriptionPlan: z.string().optional(),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  notes: z.string().optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(6, "Şifre doğrulaması zorunludur"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

type UserCreateForm = z.infer<typeof userCreateSchema>

export default function UserCreatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<UserCreateForm>({
    resolver: zodResolver(userCreateSchema),
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
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: UserCreateForm) => {
    try {
      setSaving(true)

      // Simulate API call to create user
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real app, this would be an API call
      console.log("Creating user:", {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalBookings: 0,
        totalSpent: 0,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString(),
      })

      toast.success("Kullanıcı başarıyla oluşturuldu")
      router.push("/users")
    } catch (error) {
      toast.error("Kullanıcı oluşturulamadı")
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-2xl font-bold">Yeni Kullanıcı Oluştur</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/users">
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
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Kullanıcı Oluştur
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

            {/* Password Section */}
            <Card>
              <CardHeader>
                <CardTitle>Şifre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register("password")}
                      placeholder="En az 6 karakter"
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Şifre Doğrula</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...form.register("confirmPassword")}
                      placeholder="Şifreyi tekrar girin"
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.confirmPassword.message}
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
            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Rol Seçimi</h4>
                    <p className="text-muted-foreground">
                      Kullanıcının sistemdeki yetki seviyesini belirler.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Şifre Güvenliği</h4>
                    <p className="text-muted-foreground">
                      Şifre en az 6 karakter olmalıdır.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">E-posta Doğrulama</h4>
                    <p className="text-muted-foreground">
                      Yeni kullanıcılar varsayılan olarak e-posta doğrulamasız oluşturulur.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Sistem Durumu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Kullanıcılar:</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aktif Kullanıcılar:</span>
                    <span className="font-medium text-green-600">1,156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yeni Kayıtlar (Bugün):</span>
                    <span className="font-medium">12</span>
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